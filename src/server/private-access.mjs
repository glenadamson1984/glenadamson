import { validSession, cookieName } from '../lib/master-auth.mjs';

export function requireAdmin({ req, res }, destination) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!validSession(req.cookies[cookieName])) {
    return { redirect: { destination: `/login?next=${encodeURIComponent(destination)}`, permanent: false } };
  }
  return null;
}
