import { ALL_SESSION_COOKIE_NAMES } from '@cera/contracts/session';
import { NextResponse } from 'next/server';

import { oidcIssuer, type OidcAudience } from '../../../lib/auth/oidc.ts';
import { siteUrl } from '../../../lib/site-url.ts';

export function GET(request?: Request): NextResponse {
  const url = siteUrl();
  const requested =
    request === undefined ? null : new URL(request.url).searchParams.get('audience');
  const audience: OidcAudience = requested === 'staff' ? 'staff' : 'customer';
  const issuer = oidcIssuer(audience);
  const signedOutUrl = new URL('/auth/signed-out', url.origin);
  signedOutUrl.searchParams.set('audience', audience);
  const endSession =
    issuer === undefined
      ? signedOutUrl.pathname + signedOutUrl.search
      : `${issuer.replace(/\/$/, '')}/end-session/?post_logout_redirect_uri=${encodeURIComponent(signedOutUrl.toString())}`;
  const response = NextResponse.redirect(new URL(endSession, url.origin));
  for (const name of ALL_SESSION_COOKIE_NAMES) {
    response.cookies.set(name, '', {
      secure: true,
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}
