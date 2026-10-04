import { CompactEncrypt, compactDecrypt } from 'jose';

/** Fixed for Playwright only — must match `SESSION_SECRET` in `playwright.config.ts`. */
export const E2E_SESSION_SECRET = Buffer.alloc(32, 0xe2).toString('base64');

function sessionKey() {
  return Buffer.from(E2E_SESSION_SECRET, 'base64').subarray(0, 32);
}

export function customerClaims(variant) {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: 'e2e-portal-customer',
    email: 'portal-customer@example.com',
    emailVerified: variant === 'verified',
    roles: ['customer'],
    mfa: false,
    iat: now,
    exp: now + 12 * 60 * 60,
    absoluteExp: now + 7 * 24 * 60 * 60,
  };
}

export async function sealE2eSession(variant) {
  const key = sessionKey();
  return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(customerClaims(variant))))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(key);
}

export async function openE2eSession(token) {
  const { plaintext } = await compactDecrypt(token, sessionKey());
  return JSON.parse(new TextDecoder().decode(plaintext));
}
