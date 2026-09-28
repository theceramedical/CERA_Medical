import { RoleSchema, type Role } from '@cera/contracts';
import { CompactEncrypt, compactDecrypt } from 'jose';

/**
 * JWE-sealed session (ADR-004). The payload never sits in a readable cookie.
 */

export interface SessionClaims {
  readonly sub: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly roles: readonly Role[];
  readonly mfa: boolean;
  readonly iat: number;
  readonly exp: number;
  readonly absoluteExp: number;
}

export const CUSTOMER_IDLE_SECONDS = 12 * 60 * 60;
export const CUSTOMER_ABSOLUTE_SECONDS = 7 * 24 * 60 * 60;
export const STAFF_IDLE_SECONDS = 60 * 60;
export const STAFF_ABSOLUTE_SECONDS = 8 * 60 * 60;

const denyList = new Set<string>();

export function sessionKeyFromSecret(secret: string): Uint8Array {
  const raw = Buffer.from(secret, base64Encoding(secret));
  if (raw.byteLength < 32) {
    throw new Error('SESSION_SECRET must decode to at least 32 bytes');
  }
  return raw.subarray(0, 32);
}

function base64Encoding(secret: string): BufferEncoding {
  return /^[A-Za-z0-9+/]+=*$/.test(secret) || /^[A-Za-z0-9_-]+$/.test(secret) ? 'base64' : 'utf8';
}

export function isStaffSession(roles: readonly Role[]): boolean {
  return roles.some((role) => role !== 'customer' && role !== 'content_editor');
}

export function issueClaims(
  input: Omit<SessionClaims, 'iat' | 'exp' | 'absoluteExp'>,
  now = Math.floor(Date.now() / 1000),
): SessionClaims {
  const staff = isStaffSession(input.roles);
  const idle = staff ? STAFF_IDLE_SECONDS : CUSTOMER_IDLE_SECONDS;
  const absolute = staff ? STAFF_ABSOLUTE_SECONDS : CUSTOMER_ABSOLUTE_SECONDS;
  return {
    ...input,
    iat: now,
    exp: now + idle,
    absoluteExp: now + absolute,
  };
}

export async function sealSession(claims: SessionClaims, key: Uint8Array): Promise<string> {
  return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(claims)))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(key);
}

export async function unsealSession(
  token: string,
  key: Uint8Array,
  now = Math.floor(Date.now() / 1000),
) {
  const { plaintext } = await compactDecrypt(token, key);
  const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as SessionClaims;
  if (
    !Array.isArray(parsed.roles) ||
    parsed.roles.some((role) => !RoleSchema.safeParse(role).success)
  ) {
    return null;
  }
  if (denyList.has(parsed.sub)) return null;
  if (parsed.exp <= now || parsed.absoluteExp <= now) return null;
  return parsed;
}

export function revokeSubject(sub: string): void {
  denyList.add(sub);
}

export function clearRevocations(): void {
  denyList.clear();
}

export function slideIdle(
  claims: SessionClaims,
  now = Math.floor(Date.now() / 1000),
): SessionClaims {
  const staff = isStaffSession(claims.roles);
  const idle = staff ? STAFF_IDLE_SECONDS : CUSTOMER_IDLE_SECONDS;
  return { ...claims, exp: Math.min(now + idle, claims.absoluteExp) };
}
