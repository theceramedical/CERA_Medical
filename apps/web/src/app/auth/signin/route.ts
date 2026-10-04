import { OIDC_STATE_COOKIE_NAME } from '@cera/contracts/session';
import { NextResponse } from 'next/server';
import { buildAuthorizationUrl } from 'openid-client';

import {
  createHandshakeSecrets,
  createPkce,
  oidcConfiguration,
  registeredOidcRedirectUri,
  sealHandshake,
} from '../../../lib/auth/oidc.ts';
import { safeReturnTo } from '../../../lib/auth/return-to.ts';
import { siteUrl } from '../../../lib/site-url.ts';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  try {
    const next = safeReturnTo(url.searchParams.get('next'));
    const { state, nonce } = createHandshakeSecrets();
    const pkce = createPkce();
    const location = buildAuthorizationUrl(await oidcConfiguration(), {
      response_type: 'code',
      client_id: process.env.OIDC_CLIENT_ID ?? '',
      redirect_uri: registeredOidcRedirectUri().toString(),
      scope: 'openid email profile cera_mfa',
      state,
      nonce,
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
    });
    const response = NextResponse.redirect(location);
    response.cookies.set(
      OIDC_STATE_COOKIE_NAME,
      await sealHandshake({ state, nonce, verifier: pkce.verifier, next, createdAt: Date.now() }),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 600,
      },
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL('/auth/error?reason=unavailable', siteUrl()));
  }
}
