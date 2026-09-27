import { OIDC_STATE_COOKIE_NAME } from '@cera/contracts/session';
import { NextResponse } from 'next/server';

import { createHandshakeSecrets, createPkce } from '../../../lib/auth/oidc.ts';
import { safeReturnTo } from '../../../lib/auth/return-to.ts';

/**
 * Starts the OIDC authorization-code + PKCE handshake.
 *
 * Cross-app import of the PKCE helper keeps the verifier algorithm identical
 * to the API's tests. Discovery against Authentik is skipped when
 * `OIDC_ISSUER` is unset so local and Playwright runs still have a sign-in
 * affordance.
 */
export function GET(request: Request): NextResponse {
  const url = new URL(request.url);
  const next = safeReturnTo(url.searchParams.get('next'));
  const { state, nonce } = createHandshakeSecrets();
  const pkce = createPkce();
  const payload = JSON.stringify({ state, nonce, verifier: pkce.verifier, next });

  const issuer = process.env.OIDC_ISSUER;
  const clientId = process.env.OIDC_CLIENT_ID;
  const redirectUri = process.env.OIDC_REDIRECT_URI ?? `${url.origin}/auth/callback`;

  const location =
    issuer !== undefined && clientId !== undefined
      ? `${issuer.replace(/\/$/, '')}/application/o/authorize/?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('openid email profile groups')}&state=${state}&nonce=${nonce}&code_challenge=${pkce.challenge}&code_challenge_method=S256`
      : `/auth/callback?code=local&state=${state}`;

  const response = NextResponse.redirect(new URL(location, url.origin));
  response.cookies.set(OIDC_STATE_COOKIE_NAME, payload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    path: '/',
    maxAge: 600,
  });
  return response;
}
