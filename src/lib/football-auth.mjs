import { createHmac, timingSafeEqual } from 'node:crypto';

export const cookieName = 'football_session';
export const maxAge = 60 * 60 * 12;
// Temporary shared PIN, as requested. Set these environment variables to override.
const pin = () => process.env.FOOTBALL_PIN || '3217';
const secret = () => process.env.FOOTBALL_SESSION_SECRET || 'tornadoes-2026-27-temporary-shared-session-14b873acd94f';
const sign = value => createHmac('sha256', secret()).update(value).digest('hex');
export function correctPin(value) {
  if (typeof value !== 'string' || !/^[0-9]{4}$/.test(value) || value.length !== pin().length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(pin()));
}
export function createSession(now = Date.now()) {
  const expires = String(now + maxAge * 1000);
  return `${expires}.${sign(expires)}`;
}
export function validSession(value, now = Date.now()) {
  if (typeof value !== 'string') return false;
  const [expires, signature, extra] = value.split('.');
  if (extra || !/^\d+$/.test(expires) || !/^[a-f0-9]{64}$/.test(signature || '') || Number(expires) <= now || Number(expires) > now + maxAge * 1000) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(sign(expires)));
}
