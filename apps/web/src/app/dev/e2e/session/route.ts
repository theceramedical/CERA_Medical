import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { NextResponse } from 'next/server';

import { sealHandshake } from '../../../../lib/auth/oidc.ts';
import { assertDevOnly } from '../../guard.ts';

/**
 * Playwright-only session bootstrap. `__Host-` cookies cannot be injected with
 * `browserContext.addCookies`, so tests hit this route instead.
 */
export async function GET(request: Request): Promise<NextResponse> {
  assertDevOnly();
  const url = new URL(request.url);
  const unverified = url.searchParams.get('variant') === 'unverified';
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: 'e2e-portal-customer',
    email: 'portal-customer@example.com',
    emailVerified: !unverified,
    roles: ['customer'],
    mfa: false,
    iat: now,
    exp: now + 12 * 60 * 60,
    absoluteExp: now + 7 * 24 * 60 * 60,
  };
  const response = NextResponse.redirect(new URL('/account', url));
  response.cookies.set(SESSION_COOKIE_NAME, await sealHandshake(claims), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 12 * 60 * 60,
  });
  return response;
}
