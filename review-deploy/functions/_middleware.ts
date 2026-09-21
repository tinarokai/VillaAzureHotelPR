// Review-copy gate for villa-azure-hotel (branch "review" only).
// Basic auth on every path, /api/* disabled so the contact form cannot send,
// noindex + no-store on every response. Production (branch main) never includes this file.
const USER = 'tina';
const PASS = 'azure-d1478464';

export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    return new Response('Not available on the review copy.', { status: 404 });
  }
  const expected = 'Basic ' + btoa(USER + ':' + PASS);
  if (request.headers.get('Authorization') !== expected) {
    return new Response('Authentication required.', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Villa Azure Hotel review", charset="UTF-8"' },
    });
  }
  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  out.headers.set('Cache-Control', 'no-store');
  return out;
};
