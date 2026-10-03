import {
  ALL_SESSION_COOKIE_NAMES,
  OIDC_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from '@cera/contracts/session';
import { NextResponse, type NextRequest } from 'next/server';
import { authorizationCodeGrant } from 'openid-client';

import {
  identityClaims,
  configuredCallbackUrl,
  oidcConfiguration,
  openHandshake,
  sealHandshake,
} from '../../../lib/auth/oidc.ts';
import { safeReturnTo } from '../../../lib/auth/return-to.ts';
import { siteUrl } from '../../../lib/site-url.ts';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  let response: NextResponse;
  try {
    const token = request.cookies.get(OIDC_STATE_COOKIE_NAME)?.value;
    if (!token) throw new Error('Missing handshake');
    const handshake = await openHandshake(token);
    const tokens = await authorizationCodeGrant(
      await oidcConfiguration(),
      configuredCallbackUrl(url),
      {
        pkceCodeVerifier: handshake.verifier,
        expectedState: handshake.state,
        expectedNonce: handshake.nonce,
        idTokenExpected: true,
      },
    );
    const identity = identityClaims(tokens.claims() ?? {});
    if (!identity.roles.length) throw new Error('No platform role');
    const staff = identity.roles.some((role) => role !== 'customer');
    if (staff && !identity.mfa) throw new Error('Staff MFA required');
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (staff ? 30 * 60 : 12 * 60 * 60);
    const claims = {
      ...identity,
      iat: now,
      exp,
      absoluteExp: now + (staff ? 8 * 60 * 60 : 7 * 24 * 60 * 60),
    };
    response = NextResponse.redirect(new URL(safeReturnTo(handshake.next), siteUrl()));
    response.cookies.set(SESSION_COOKIE_NAME, await sealHandshake(claims), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: exp - now,
    });
    for (const name of ALL_SESSION_COOKIE_NAMES)
      if (name !== SESSION_COOKIE_NAME)
        response.cookies.set(name, '', { secure: true, path: '/', maxAge: 0 });
  } catch (error) {
    console.error(
      'OIDC callback failed:',
      error instanceof Error ? error.message : 'unknown error',
    );
    response = NextResponse.redirect(new URL('/auth/error?reason=identity', siteUrl()));
  }
  response.cookies.set(OIDC_STATE_COOKIE_NAME, '', { secure: true, path: '/', maxAge: 0 });
  return response;
}
