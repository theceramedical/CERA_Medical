import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { cookies } from 'next/headers';

import { getSession } from '../../../../lib/auth/session.ts';

/**
 * The CERA session is a __Host- cookie scoped to www. The browser cannot send
 * it to api.ceramedical.org, so forward authenticated checkout server-side.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string[] }> },
): Promise<Response> {
  const { action } = await context.params;
  const operation = action.join('/');
  if (operation !== 'complete' && operation !== 'safepay/start') {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const origin = request.headers.get('origin');
  const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url).origin;
  if (origin !== null && origin !== siteOrigin) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const session = await getSession();
  if (session === null || !session.roles.includes('customer') || !session.emailVerified) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const jar = await cookies();
  const sealedSession = jar.get(SESSION_COOKIE_NAME)?.value;
  if (sealedSession === undefined) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const api = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!api) return Response.json({ error: 'upstream_unavailable' }, { status: 503 });
  let upstream: Response;
  try {
    upstream = await fetch(`${api.replace(/\/$/, '')}/v1/checkout/${operation}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${sealedSession}`,
        'content-type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
      body: await request.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return Response.json({ error: 'upstream_unavailable' }, { status: 503 });
  }
  const response = new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie);
  }
  return response;
}
