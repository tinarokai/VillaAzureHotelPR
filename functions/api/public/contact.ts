/**
 * POST /api/public/contact — the site's contact form endpoint.
 *
 * Two independent outcomes per submission:
 *   1. email the enquiry to CONTACT_TO via the Email Sending REST API (primary —
 *      this is what the hotel actually reads)
 *   2. record it in the D1 table `contact_submissions` (backup — survives a
 *      bounced or spam-filtered email, and is queryable)
 *
 * The response is ok if EITHER succeeded. Only when both fail does the visitor
 * see the form's "failed" state, so they fall back to WhatsApp or the phone
 * number instead of assuming the enquiry went through.
 *
 * Request/response contract is unchanged from the original Lovable route, so
 * contact.html and js/main.js are untouched.
 *
 * Bindings / vars (wrangler.toml)      Secret (wrangler pages secret put)
 *   DB             D1 database           EMAIL_API_TOKEN  Cloudflare token, Email Sending: Edit
 *   CF_ACCOUNT_ID
 *   CONTACT_TO     notification recipient
 *   CONTACT_FROM   sender, on a domain onboarded to Email Sending
 */

interface D1Binding {
  prepare(sql: string): {
    bind(...values: unknown[]): { run(): Promise<{ success: boolean; error?: string }> };
  };
}

interface Env {
  DB?: D1Binding;
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

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    // Size guard in bytes. 16 KB is a sanity limit for a contact form.
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

    // Both paths run to completion regardless of the other's outcome.
    const [sent, stored] = await Promise.all([
      notify(env, data),
      store(env, data, request.headers.get("user-agent")),
    ]);

    if (!sent && !stored) {
      console.error("[contact] enquiry lost: email and storage both failed", { name: data.name, email: data.email });
      return json({ ok: false, error: "Delivery failed" }, 500);
    }
    if (!sent) console.warn("[contact] email failed; enquiry is in D1 only");
    if (!stored) console.warn("[contact] D1 insert failed; enquiry was emailed only");
    return json({ ok: true });
  } catch (err) {
    console.error("[contact] unexpected", err);
    return json({ ok: false, error: "Server error" }, 500);
  }
};

/* ---------- validation ---------- */

// zod's email pattern, kept from the original route so accepted addresses don't change.
const EMAIL_RE = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;

/** Required string, trimmed, 1..max. */
function req(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length >= 1 && s.length <= max ? s : null;
}
/** Optional: absent, or a string up to max. null and non-strings are invalid. */
function opt(v: unknown, max: number): string | null {
  if (v === undefined) return "";
  if (typeof v !== "string") return null;
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

/* ---------- storage (D1) ---------- */

async function store(env: Env, d: Submission, userAgent: string | null): Promise<boolean> {
  if (!env.DB) {
    console.warn("[contact] DB binding missing");
    return false;
  }
  try {
    const r = await env.DB.prepare(
      `INSERT INTO contact_submissions (name, email, phone, subject, message, source, locale, user_agent)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
      .bind(
        d.name,
        d.email,
        d.phone || null,
        d.subject || null,
        d.message,
        d.source || null,
        d.locale || null,
        userAgent ?? null,
      )
      .run();
    if (!r.success) console.error("[contact] D1 insert not successful");
    return r.success;
  } catch (err) {
    console.error("[contact] D1 insert threw", err);
    return false;
  }
}

/* ---------- notification (Email Sending REST API) ---------- */

async function notify(env: Env, d: Submission): Promise<boolean> {
  if (!env.CF_ACCOUNT_ID || !env.EMAIL_API_TOKEN || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.warn("[contact] email not configured");
    return false;
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
    if (!res.ok) {
      console.warn("[contact] email send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[contact] email send threw", err);
    return false;
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
