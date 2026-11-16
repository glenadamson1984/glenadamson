import { cookieName, maxAge, correctPin, createSession } from '../../src/lib/football-auth.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'Request not allowed' });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
    return res.status(200).json({ ok: true });
  }
  if (!correctPin(req.body?.pin)) {
    await new Promise(resolve => setTimeout(resolve, 750));
    return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
  }
  res.setHeader('Set-Cookie', `${cookieName}=${createSession()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`);
  return res.status(200).json({ ok: true });
}
export const config = { api: { bodyParser: { sizeLimit: '1kb' } } };
