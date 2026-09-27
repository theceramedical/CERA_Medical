import { createHash, randomBytes } from 'node:crypto';

/**
 * PKCE + state + nonce helpers. Discovery and token exchange use openid-client
 * when OIDC_ISSUER is reachable; tests use the fake port below.
 */

export interface OidcIdentity {
  readonly sub: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly groups: readonly string[];
  readonly amr: readonly string[];
}

export interface OidcPort {
  authorizationUrl(input: {
    readonly state: string;
    readonly nonce: string;
    readonly codeChallenge: string;
    readonly redirectUri: string;
  }): string;
  exchange(input: {
    readonly code: string;
    readonly codeVerifier: string;
    readonly expectedNonce: string;
    readonly expectedState: string;
    readonly state: string;
  }): Promise<OidcIdentity>;
}

export function createPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function createHandshakeSecrets(): { state: string; nonce: string } {
  return { state: randomBytes(16).toString('hex'), nonce: randomBytes(16).toString('hex') };
}

export function sessionSatisfiedMfa(identity: OidcIdentity): boolean {
  return identity.amr.includes('mfa') || identity.amr.includes('otp') || identity.amr.includes('hwk');
}

export function fakeOidcPort(identities: Record<string, OidcIdentity>): OidcPort {
  return {
    authorizationUrl(input) {
      return `https://auth.example/authorize?state=${input.state}&nonce=${input.nonce}`;
    },
    exchange(input) {
      if (input.state !== input.expectedState) {
        return Promise.reject(new Error('state_mismatch'));
      }
      const identity = identities[input.code];
      if (identity === undefined) return Promise.reject(new Error('unknown_code'));
      return Promise.resolve(identity);
    },
  };
}
