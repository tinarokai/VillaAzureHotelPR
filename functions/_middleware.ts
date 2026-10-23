/**
 * Host canonicalization: 301 www.villaazurehotelpr.com -> villaazurehotelpr.com,
 * preserving path and query. Pages' _redirects file only matches paths, not
 * hostnames, so the www redirect has to live here.
 */
const APEX = "villaazurehotelpr.com";

export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  if (url.hostname === `www.${APEX}`) {
    url.hostname = APEX;
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
