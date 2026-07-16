import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(4000),
  source: z.string().trim().max(200).optional().or(z.literal("")),
  locale: z.string().trim().max(10).optional().or(z.literal("")),
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const parsed = schema.safeParse(body);
          if (!parsed.success) {
            return new Response(
              JSON.stringify({ ok: false, error: "Invalid submission" }),
              { status: 400, headers: { "Content-Type": "application/json", ...cors } },
            );
          }
          const data = parsed.data;
          const userAgent = request.headers.get("user-agent") ?? undefined;

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { error } = await supabaseAdmin.from("contact_submissions").insert({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            subject: data.subject || null,
            message: data.message,
            source: data.source || null,
            locale: data.locale || null,
            user_agent: userAgent,
          });
          if (error) {
            console.error("[contact] insert failed", error);
            return new Response(
              JSON.stringify({ ok: false, error: "Storage failed" }),
              { status: 500, headers: { "Content-Type": "application/json", ...cors } },
            );
          }

          // Try to notify info@villaazurehotelpr.com via Lovable Emails.
          // If the email domain isn't set up yet, the submission is still stored.
          try {
            const { sendLovableEmail } = await import("@lovable.dev/email-js");
            await sendLovableEmail({
              to: "info@villaazurehotelpr.com",
              subject: `New enquiry: ${data.subject || "Website contact"} — ${data.name}`,
              replyTo: data.email,
              html: `
                <h2>New website enquiry</h2>
                <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(data.phone || "—")}</p>
                <p><strong>Subject:</strong> ${escapeHtml(data.subject || "—")}</p>
                <p><strong>Source:</strong> ${escapeHtml(data.source || "—")} (${escapeHtml(data.locale || "en")})</p>
                <hr>
                <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
              `,
            });
          } catch (mailErr) {
            console.warn("[contact] email send skipped/failed", mailErr);
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...cors },
          });
        } catch (err) {
          console.error("[contact] unexpected", err);
          return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}