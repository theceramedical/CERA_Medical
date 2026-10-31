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

export type OidcAudience = 'customer' | 'staff';

function audienceEnv(
  audience: OidcAudience,
  key: 'ISSUER' | 'CLIENT_ID' | 'CLIENT_SECRET' | 'REDIRECT_URI',
) {
  const value = process.env[`OIDC_${audience.toUpperCase()}_${key}`];
  if (value?.trim()) return value.trim();
  const shared = process.env[`OIDC_${key}`];
  return shared?.trim() ? shared.trim() : undefined;
}

/** Registered redirect URI (no query) — must match Authentik and the authorize request. */
export function registeredOidcRedirectUri(audience: OidcAudience = 'customer'): URL {
  return new URL(
    audienceEnv(audience, 'REDIRECT_URI') ?? new URL('/auth/callback', siteUrl()).toString(),
  );
}

/**
 * Callback URL for `authorizationCodeGrant`: canonical origin/path with the provider's `code` and
 * `state` query intact. Stripping `search` breaks token exchange behind reverse proxies that
 * rewrite the request host to an internal address.
 */
export function configuredCallbackUrl(requestUrl: URL, audience: OidcAudience = 'customer'): URL {
  const registered = registeredOidcRedirectUri(audience);
  const callback = new URL(registered.href);
  callback.search = requestUrl.search;
  callback.hash = requestUrl.hash;
  return callback;
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
  /** The workspace the user explicitly entered; prevents cross-portal redirects. */
  audience?: 'customer' | 'staff';
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
const configurations = new Map<OidcAudience, Promise<oidc.Configuration>>();
export function oidcIssuer(audience: OidcAudience = 'customer'): string | undefined {
  return audienceEnv(audience, 'ISSUER');
}
export function oidcClientId(audience: OidcAudience = 'customer'): string | undefined {
  return audienceEnv(audience, 'CLIENT_ID');
}
/** Whether this audience can start a sealed OIDC flow in the current environment. */
export function oidcConfigured(audience: OidcAudience = 'customer'): boolean {
  const issuerValue = audienceEnv(audience, 'ISSUER');
  const clientId = audienceEnv(audience, 'CLIENT_ID');
  const clientSecret = audienceEnv(audience, 'CLIENT_SECRET');
  const sessionSecret = Buffer.from(process.env.SESSION_SECRET ?? '', 'base64');
  if (!issuerValue || !clientId || !clientSecret || sessionSecret.length < 32) return false;
  if (process.env.CERA_ENV !== 'local') {
    const prefix = `OIDC_${audience.toUpperCase()}`;
    const ownClientId = process.env[`${prefix}_CLIENT_ID`]?.trim();
    const ownClientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim();
    const otherAudience = audience === 'customer' ? 'STAFF' : 'CUSTOMER';
    const otherClientId = process.env[`OIDC_${otherAudience}_CLIENT_ID`]?.trim();
    if (!ownClientId || !ownClientSecret || (otherClientId && ownClientId === otherClientId))
      return false;
  }
  try {
    const issuer = new URL(issuerValue);
    const localEnvironment = process.env.CERA_ENV === 'local';
    const localIssuer = localEnvironment && ['localhost', '127.0.0.1'].includes(issuer.hostname);
    if (
      (issuer.protocol !== 'https:' && !localIssuer) ||
      issuer.username ||
      issuer.password ||
      issuer.search ||
      issuer.hash
    )
      return false;
    const redirect = registeredOidcRedirectUri(audience);
    const localRedirect =
      localEnvironment && ['localhost', '127.0.0.1'].includes(redirect.hostname);
    if (
      (redirect.protocol !== 'https:' && !localRedirect) ||
      redirect.username ||
      redirect.password ||
      redirect.search ||
      redirect.hash
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
export function oidcConfiguration(
  audience: OidcAudience = 'customer',
): Promise<oidc.Configuration> {
  if (!oidcConfigured(audience)) throw new Error('OIDC configuration incomplete');
  const existing = configurations.get(audience);
  if (existing) return existing;
  const issuer = new URL(audienceEnv(audience, 'ISSUER') ?? '');
  const local =
    process.env.CERA_ENV === 'local' && ['localhost', '127.0.0.1'].includes(issuer.hostname);
  if (issuer.protocol !== 'https:' && !local) throw new Error('OIDC requires HTTPS');
  const clientId = audienceEnv(audience, 'CLIENT_ID');
  const clientSecret = audienceEnv(audience, 'CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('OIDC credentials missing');
  const configuration = oidc
    .discovery(
      issuer,
      clientId,
      clientSecret,
      oidc.ClientSecretPost(clientSecret),
      local ? { execute: [oidc.allowInsecureRequests] } : undefined,
    )
    .catch((error) => {
      configurations.delete(audience);
      throw error;
    });
  configurations.set(audience, configuration);
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
/**
 * A verified email is only an explicit true claim.
 * Missing, false, and any other value stay unverified. The string "true" is
 * accepted because some identity providers serialise the boolean that way.
 */
export function emailVerifiedClaim(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'string' && value.trim().toLowerCase() === 'true') return true;
  return false;
}

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
  const emailVerified = emailVerifiedClaim(claims.email_verified);
  if (roles.length === 0 && emailVerified) {
    roles.push('customer');
  }
  roles.forEach((role) => RoleSchema.parse(role));
  const amr = Array.isArray(claims.amr)
    ? claims.amr.filter((method): method is string => typeof method === 'string')
    : [];
  const amrMethods = amr.map((method) => method.toLowerCase());
  const factorClasses = new Set(
    amrMethods.flatMap((method) => {
      if (['pwd', 'kba'].includes(method)) return ['knowledge'];
      if (['otp', 'sms', 'tel', 'email', 'hwk', 'swk', 'sc'].includes(method))
        return ['possession'];
      if (['face', 'retina', 'iris', 'fpt'].includes(method)) return ['inherence'];
      return [];
    }),
  );
  return {
    sub: claims.sub,
    email: claims.email,
    emailVerified,
    roles,
    mfa: claims.cera_mfa === true || amrMethods.includes('mfa') || factorClasses.size >= 2,
  };
}
