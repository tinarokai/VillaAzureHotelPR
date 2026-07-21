import { createFileRoute } from "@tanstack/react-router";

// Serve public/*.html at clean URLs (e.g. /about → public/about.html,
// /es → public/es/index.html, /es/rooms → public/es/rooms.html).
const htmlFiles = import.meta.glob("../../public/**/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function lookup(pathname: string): string | null {
  // Strip leading/trailing slash
  const clean = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const candidates = clean === ""
    ? ["index.html"]
    : [`${clean}.html`, `${clean}/index.html`];
  for (const rel of candidates) {
    const key = `../../public/${rel}`;
    if (htmlFiles[key]) return htmlFiles[key];
  }
  return null;
}

export const Route = createFileRoute("/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        let pathname = url.pathname;
        // Redirect /foo.html → /foo (and /es/foo.html → /es/foo)
        if (pathname.endsWith(".html")) {
          const stripped = pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
          return new Response(null, {
            status: 301,
            headers: { Location: stripped + url.search },
          });
        }
        const html = lookup(pathname);
        if (!html) {
          return new Response("Not Found", { status: 404 });
        }
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});