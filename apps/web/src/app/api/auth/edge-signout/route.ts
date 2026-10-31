import { ALL_SESSION_COOKIE_NAMES, SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { NextResponse } from 'next/server';

export function POST(): NextResponse {
  const response = NextResponse.json({ success: true, redirect: '/' });

  for (const name of ALL_SESSION_COOKIE_NAMES) {
    response.cookies.set(name, '', { secure: true, path: '/', maxAge: 0 });
  }
  response.cookies.set(SESSION_COOKIE_NAME, '', { secure: true, path: '/', maxAge: 0 });

  return response;
}
