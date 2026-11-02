import 'server-only';

import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { handleCloudflareOpsApi } from '../cloudflare/ops-api.ts';
import { getCloudflareDatabase } from '../cloudflare/runtime.ts';

import { jsonBodyForApiRequest } from './api-request-body.ts';
import { assertStaffPortalSession, signInPath } from './portal-access.ts';
import { getSession } from './session.ts';

export async function authenticatedApi<T>(
  path: string,
  options: { method?: string; body?: unknown; returnTo?: string } = {},
): Promise<T> {
  const returnTo = options.returnTo;
  const signIn = signInPath(returnTo);
  const isOpsPath = path.startsWith('/v1/ops/');
  if (!isOpsPath) redirect('/contact');

  const db = await getCloudflareDatabase();

  const session = await getSession();
  const portalOptions = returnTo === undefined ? {} : { returnTo };
  const authenticatedSession = assertStaffPortalSession(session, portalOptions);

  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  // Cloudflare runtime staff sessions are verified from the Access JWT and bound to the
  // staff hostname. Local API fallback still uses the sealed CERA session cookie.
  if (db === null && !token) redirect(signIn);

  if (db !== null) {
    const result = await handleCloudflareOpsApi(
      path,
      options.method ?? 'GET',
      options.body,
      authenticatedSession,
    );
    if (result === null)
      throw new Error('This operation is not available on the Cloudflare runtime.');
    return result as T;
  }

  const api = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!api) throw new Error('API is not configured');

  const method = options.method ?? 'GET';
  const jsonBody = jsonBodyForApiRequest(method, options.body);

  const response = await fetch(`${api.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(jsonBody === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(jsonBody === undefined ? {} : { body: jsonBody }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  if (response.status === 401) redirect(signIn);
  if (response.status === 403) {
    redirect('/auth/error?reason=access');
  }
  if (!response.ok) {
    throw new Error('This operation could not be completed. Please refresh and try again.');
  }

  return response.json() as Promise<T>;
}
