import { createHash, randomBytes } from 'node:crypto';

import { RoleSchema, type Role } from '@cera/contracts';
import { CompactEncrypt, compactDecrypt } from 'jose';
import * as oidc from 'openid-client';

import { siteUrl } from '../site-url.ts';

export function createPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
}
export function createHandshakeSecrets() {
  return { state: randomBytes(16).toString('hex'), nonce: randomBytes(16).toString('hex') };
}

/** OIDC requires the token request redirect_uri to exactly match the registered callback. */
export function configuredCallbackUrl(_requestUrl: URL): URL {
  return new URL(process.env.OIDC_REDIRECT_URI ?? new URL('/auth/callback', siteUrl()).toString());
}

export function sessionKey(): Uint8Array {
  const key = Buffer.from(process.env.SESSION_SECRET ?? '', 'base64');
  if (key.length < 32) throw new Error('SESSION_SECRET must decode to at least 32 bytes');
  return key.subarray(0, 32);
}
export async function sealHandshake(value: unknown): Promise<string> {
  return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(value)))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(sessionKey());
}
export interface Handshake {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
  createdAt: number;
}
export async function openHandshake(token: string): Promise<Handshake> {
  const { plaintext } = await compactDecrypt(token, sessionKey());
  const value = JSON.parse(new TextDecoder().decode(plaintext)) as Handshake;
  if (
    !value.state ||
    !value.nonce ||
    !value.verifier ||
    !Number.isFinite(value.createdAt) ||
    value.createdAt > Date.now() ||
    Date.now() - value.createdAt > 600_000
  )
    throw new Error('Invalid handshake');
  return value;
}
let configuration: Promise<oidc.Configuration> | undefined;
export function oidcConfiguration(): Promise<oidc.Configuration> {
  if (configuration) return configuration;
  const issuer = new URL(process.env.OIDC_ISSUER ?? '');
  const local =
    process.env.CERA_ENV === 'local' && ['localhost', '127.0.0.1'].includes(issuer.hostname);
  if (issuer.protocol !== 'https:' && !local) throw new Error('OIDC requires HTTPS');
  if (!process.env.OIDC_CLIENT_ID || !process.env.OIDC_CLIENT_SECRET)
    throw new Error('OIDC credentials missing');
  configuration = oidc
    .discovery(
      issuer,
      process.env.OIDC_CLIENT_ID,
      process.env.OIDC_CLIENT_SECRET,
      oidc.ClientSecretPost(process.env.OIDC_CLIENT_SECRET),
      local ? { execute: [oidc.allowInsecureRequests] } : undefined,
    )
    .catch((error) => {
      configuration = undefined;
      throw error;
    });
  return configuration;
}
const groups: Record<string, Role> = {
  'cera-customers': 'customer',
  'cera-content-editors': 'content_editor',
  'cera-content-approvers': 'content_approver',
  'cera-enquiry-handlers': 'enquiry_handler',
  'cera-operations-managers': 'operations_manager',
  'cera-administrators': 'administrator',
  'cera-auditors': 'auditor',
};
export function identityClaims(claims: Record<string, unknown>) {
  if (
    typeof claims.sub !== 'string' ||
    typeof claims.email !== 'string' ||
    !claims.email.includes('@')
  )
    throw new Error('Identity missing');
  const roles = [
    ...new Set(
      (Array.isArray(claims.groups) ? claims.groups : []).flatMap((g) =>
        typeof g === 'string' && groups[g] ? [groups[g]] : [],
      ),
    ),
  ];
  roles.forEach((role) => RoleSchema.parse(role));
  const amr = Array.isArray(claims.amr) ? claims.amr : [];
  return {
    sub: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified === true,
    roles,
    mfa:
      claims.cera_mfa === true ||
      amr.some((method) => ['mfa', 'otp', 'hwk'].includes(String(method))),
  };
}
