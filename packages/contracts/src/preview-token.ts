import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A time-limited preview token, shared between `apps/cms` (which mints it) and
 * `apps/web` (which accepts it).
 *
 * The draft-preview route enables Next's `draftMode()` after verifying this, and
 * nothing else. A token that never expired would be a durable URL for unpublished
 * clinical copy; a token that was just a shared secret in the query string would
 * be replayable by anyone who saw the admin screen over a shoulder. Fifteen
 * minutes is long enough to click "Preview" and short enough that a leaked URL
 * stops working before anyone bookmarks it.
 *
 * Shape: `<expSeconds>.<hex hmac>`. The MAC is over `exp\npath`, so a token for
 * `/about` cannot be reused on `/privacy`, and a token whose `exp` has been
 * rewritten fails the compare.
 */

export const PREVIEW_TTL_SECONDS = 15 * 60;

function mac(secret: string, exp: number, path: string): Buffer {
  return createHmac('sha256', secret)
    .update(`${String(exp)}\n${path}`)
    .digest();
}

export function signPreviewToken(secret: string, path: string, nowMs: number = Date.now()): string {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('preview path must be a single-origin absolute path');
  }

  const exp = Math.floor(nowMs / 1000) + PREVIEW_TTL_SECONDS;
  return `${String(exp)}.${mac(secret, exp, path).toString('hex')}`;
}

export function verifyPreviewToken(
  secret: string,
  token: string,
  path: string,
  nowMs: number = Date.now(),
): boolean {
  const [expRaw, digest] = token.split('.');
  if (expRaw === undefined || digest?.length !== 64) return false;

  const exp = Number(expRaw);
  if (!Number.isSafeInteger(exp) || exp * 1000 < nowMs) return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;

  const expected = mac(secret, exp, path);
  const actual = Buffer.from(digest, 'hex');
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}
