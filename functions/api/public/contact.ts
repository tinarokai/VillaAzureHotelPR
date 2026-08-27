/**
 * POST /api/public/contact — Pages Function replacing the Lovable server route
 * of the same path (src/routes/api/public/contact.ts). Same request body, same
 * responses, same Supabase table, so contact.html and js/main.js are untouched.
 *
 * Behaviour:
 *   1. validate the body (same rules as the original zod schema)
 *   2. insert into Supabase `contact_submissions` with the service-role key
 *   3. best-effort email to CONTACT_TO via the Email Sending REST API —
 *      a failure here is logged and never turns a stored enquiry into a 500
 *
 * Pages Functions have no send_email binding, hence the REST API.
 *
 * Vars (wrangler.toml)         Secrets (wrangler pages secret put)
 *   SUPABASE_URL                 SUPABASE_SERVICE_ROLE_KEY  legacy JWT or sb_secret_… key
 *   CF_ACCOUNT_ID                EMAIL_API_TOKEN            API token with Email Sending permission
 *   CONTACT_TO
 *   CONTACT_FROM                 must be on a domain onboarded to Email Sending
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CF_ACCOUNT_ID?: string;
  EMAIL_API_TOKEN?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

type Submission = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  source: string;
  locale: string;
};

const MAX_BODY_BYTES = 16_384;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export const onRequestOptions = async () => new Response(null, { status: 204, headers: CORS });

export const onRequestPost = async ({ request, env, waitUntil }: {
  request: Request;
  env: Env;
  waitUntil: (p: Promise<unknown>) => void;
}) => {
  try {
    // Size guard in bytes. Cloudflare already caps request bodies far above this;
    // 16 KB is a sanity limit for a contact form, so reading before checking is fine.
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return json({ ok: false, error: "Invalid submission" }, 413);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_BODY_BYTES) return json({ ok: false, error: "Invalid submission" }, 413);
    const text = new TextDecoder().decode(bytes);

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return json({ ok: false, error: "Invalid submission" }, 400);
    }
    const data = validate(raw);
    if (!data) return json({ ok: false, error: "Invalid submission" }, 400);

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[contact] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
      return json({ ok: false, error: "Storage failed" }, 500);
    }

    const stored = await storeSubmission(env, data, request.headers.get("user-agent"));
    if (!stored) return json({ ok: false, error: "Storage failed" }, 500);

    // The enquiry is safe in the database; the email is a courtesy, so it runs
    // after the response and its failure is only logged.
    waitUntil(notify(env, data));

    return json({ ok: true });
  } catch (err) {
    console.error("[contact] unexpected", err);
    return json({ ok: false, error: "Server error" }, 500);
  }
};

/* ---------- validation (same rules as the original zod schema) ---------- */

// zod's own email pattern, so the two implementations accept the same addresses.
const EMAIL_RE = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;

/** Required string, trimmed, 1..max. */
function req(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length >= 1 && s.length <= max ? s : null;
}
/** `.optional().or(z.literal(""))`: absent, or a string up to max. null and non-strings are invalid. */
function opt(v: unknown, max: number): string | null {
  if (v === undefined) return "";          // absent: fine
  if (typeof v !== "string") return null;  // null, numbers, objects: invalid, as in zod
  const s = v.trim();
  return s.length <= max ? s : null;
}

function validate(raw: unknown): Submission | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const name = req(o.name, 120);
  const email = req(o.email, 200);
  const message = req(o.message, 4000);
  const phone = opt(o.phone, 60);
  const subject = opt(o.subject, 120);
  const source = opt(o.source, 200);
  const locale = opt(o.locale, 10);
  if (name === null || email === null || message === null) return null;
  if (phone === null || subject === null || source === null || locale === null) return null;
  if (!EMAIL_RE.test(email)) return null;
  return { name, email, phone, subject, message, source, locale };
}

/* ---------- storage ---------- */

async function storeSubmission(env: Env, d: Submission, userAgent: string | null): Promise<boolean> {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
    Prefer: "return=minimal",
  };
  // New-style Supabase keys (sb_secret_…) are opaque and go in `apikey` only;
  // legacy service-role JWTs are also sent as a bearer token.
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/contact_submissions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      subject: d.subject || null,
      message: d.message,
      source: d.source || null,
      locale: d.locale || null,
      user_agent: userAgent ?? null,
    }),
  });
  if (!res.ok) {
    console.error("[contact] insert failed", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

/* ---------- notification (Email Sending REST API) ---------- */

async function notify(env: Env, d: Submission): Promise<void> {
  if (!env.CF_ACCOUNT_ID || !env.EMAIL_API_TOKEN || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.warn("[contact] email not configured; enquiry stored only");
    return;
  }
  const html = `
    <h2>New website enquiry</h2>
    <p><strong>Name:</strong> ${esc(d.name)}</p>
    <p><strong>Email:</strong> ${esc(d.email)}</p>
    <p><strong>Phone:</strong> ${esc(d.phone || "—")}</p>
    <p><strong>Subject:</strong> ${esc(d.subject || "—")}</p>
    <p><strong>Source:</strong> ${esc(d.source || "—")} (${esc(d.locale || "en")})</p>
    <hr>
    <p style="white-space:pre-wrap">${esc(d.message)}</p>`;
  const text =
    `New website enquiry\n\nName: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone || "-"}\n` +
    `Subject: ${d.subject || "-"}\nSource: ${d.source || "-"} (${d.locale || "en"})\n\n${d.message}`;
  const subject = oneLine(`New enquiry: ${d.subject || "Website contact"} — ${d.name}`).slice(0, 200);

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.EMAIL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: env.CONTACT_TO,
          from: { address: env.CONTACT_FROM, name: "Villa Azure Website" },
          reply_to: d.email,
          subject,
          html,
          text,
        }),
      },
    );
    if (!res.ok) console.warn("[contact] email send failed", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.warn("[contact] email send failed", err);
  }
}

/** Header-ish fields must be a single line. */
function oneLine(s: string) {
  return s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
