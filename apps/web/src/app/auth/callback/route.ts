import { NextResponse } from 'next/server';

/** OIDC callbacks are retired. Staff authentication is performed at the Cloudflare Access edge. */
export function GET(): Response {
  return NextResponse.json({ error: 'authentication_method_retired' }, { status: 410 });
}
