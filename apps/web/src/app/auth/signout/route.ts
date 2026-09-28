import { ALL_SESSION_COOKIE_NAMES } from '@cera/contracts/session';
import { NextResponse } from 'next/server';

export function GET(request: Request): NextResponse {
  const url = new URL(request.url);
  const issuer = process.env.OIDC_ISSUER;
  const endSession =
    issuer === undefined
      ? '/'
      : `${issuer.replace(/\/$/, '')}/end-session/?post_logout_redirect_uri=${encodeURIComponent(`${url.origin}/`)}`;
  const response = NextResponse.redirect(new URL(endSession, url.origin));
  for (const name of ALL_SESSION_COOKIE_NAMES) {
    response.cookies.set(name, '', { secure: true, path: '/', maxAge: 0 });
  }
  return response;
}
