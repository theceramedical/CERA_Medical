import { ALL_SESSION_COOKIE_NAMES } from '@cera/contracts/session';
import { NextResponse } from 'next/server';

const STAFF_ACCESS_LOGOUT_URL = 'https://staff.ceramedical.org/cdn-cgi/access/logout';

export function GET(request?: Request): NextResponse {
  const url = request === undefined ? null : new URL(request.url);
  const local = process.env.CERA_ENV === 'local';
  const target =
    local && url !== null
      ? new URL('/auth/signed-out?audience=staff', url.origin)
      : STAFF_ACCESS_LOGOUT_URL;
  const response = NextResponse.redirect(target);
  for (const name of ALL_SESSION_COOKIE_NAMES) {
    response.cookies.set(name, '', {
      secure: true,
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}
