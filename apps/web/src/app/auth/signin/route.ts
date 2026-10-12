import { OIDC_STATE_COOKIE_NAME } from '@cera/contracts/session';
import { NextResponse } from 'next/server';
import { buildAuthorizationUrl } from 'openid-client';

import { resolveOidcSocialProviderForReturnTarget } from '../../../lib/auth/oidc-social.ts';
import {
  createHandshakeSecrets,
  createPkce,
  oidcClientId,
  oidcConfiguration,
  registeredOidcRedirectUri,
  sealHandshake,
} from '../../../lib/auth/oidc.ts';
import { isStaffReturnTo, safeReturnTo } from '../../../lib/auth/return-to.ts';
import { siteUrl } from '../../../lib/site-url.ts';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  try {
    const next = safeReturnTo(url.searchParams.get('next'));
    const audience = isStaffReturnTo(next) ? 'staff' : 'customer';
    // The customer page hides social providers on a staff return path. Enforce the same rule
    // here, because query strings are an API surface and can be typed or linked directly.
    const social = resolveOidcSocialProviderForReturnTarget(
      url.searchParams.get('provider'),
      isStaffReturnTo(next),
    );
    const { state, nonce } = createHandshakeSecrets();
    const pkce = createPkce();
    const location = buildAuthorizationUrl(await oidcConfiguration(audience), {
      response_type: 'code',
      client_id: oidcClientId(audience) ?? '',
      redirect_uri: registeredOidcRedirectUri(audience).toString(),
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
      ...(social !== undefined ? { source: social.sourceSlug } : {}),
    });
    const response = NextResponse.redirect(location);
    response.cookies.set(
      OIDC_STATE_COOKIE_NAME,
      await sealHandshake({
        state,
        nonce,
        verifier: pkce.verifier,
        next,
        audience,
        createdAt: Date.now(),
      }),
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
