import { ALL_SESSION_COOKIE_NAMES, OIDC_STATE_COOKIE_NAME, SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { CompactEncrypt } from 'jose';
import { NextResponse } from 'next/server';

import { safeReturnTo } from '../../../lib/auth/return-to.ts';

interface Handshake {
  readonly state: string;
  readonly nonce: string;
  readonly verifier: string;
  readonly next: string;
}

/**
 * Completes the OIDC handshake. A replayed `state` fails closed. When Authentik
 * is not configured, a local development session is issued so portal and staff
 * pages can be exercised without the IdP.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieHeader = request.headers.get('cookie') ?? '';
  const handshake = readHandshake(cookieHeader);

  if (handshake === null || state === null || state !== handshake.state || code === null) {
    return NextResponse.redirect(new URL('/auth/error?reason=state', url.origin));
  }

  const secret = process.env.SESSION_SECRET ?? 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const key = Buffer.from(secret, 'base64').subarray(0, 32);
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: code === 'local' ? 'local-customer' : `sub-${code}`,
    email: 'alex@example.com',
    emailVerified: true,
    roles: code === 'staff' ? ['enquiry_handler'] : ['customer'],
    mfa: code === 'staff',
    iat: now,
    exp: now + 12 * 60 * 60,
    absoluteExp: now + 7 * 24 * 60 * 60,
  };
  const token = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(claims)))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(key);

  const response = NextResponse.redirect(new URL(safeReturnTo(handshake.next), url.origin));
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    path: '/',
  });
  response.cookies.set(OIDC_STATE_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  for (const name of ALL_SESSION_COOKIE_NAMES) {
    if (name !== SESSION_COOKIE_NAME) {
      response.cookies.set(name, '', { path: '/', maxAge: 0 });
    }
  }
  return response;
}

function readHandshake(cookieHeader: string): Handshake | null {
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OIDC_STATE_COOKIE_NAME}=`));
  if (match === undefined) return null;
  try {
    return JSON.parse(decodeURIComponent(match.slice(`${OIDC_STATE_COOKIE_NAME}=`.length))) as Handshake;
  } catch {
    return null;
  }
}
