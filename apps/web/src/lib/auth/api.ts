import 'server-only';

import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { jsonBodyForApiRequest } from './api-request-body.ts';
import {
  apiPathRequiresVerifiedEmail,
  assertCustomerPortalSession,
  assertStaffPortalSession,
  signInPath,
} from './portal-access.ts';
import { getSession } from './session.ts';

const CUSTOMER_LIST_PATHS = new Set(['/v1/me/profile', '/v1/me/enquiries', '/v1/me/orders']);

export async function authenticatedApi<T>(
  path: string,
  options: { method?: string; body?: unknown; returnTo?: string } = {},
): Promise<T> {
  const returnTo = options.returnTo;
  const signIn = signInPath(returnTo);

  const session = await getSession();
  const portalOptions = returnTo === undefined ? {} : { returnTo };
  if (path.startsWith('/v1/ops/')) {
    assertStaffPortalSession(session, portalOptions);
  } else {
    assertCustomerPortalSession(session, {
      ...portalOptions,
      emailVerified: apiPathRequiresVerifiedEmail(path),
    });
  }

  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) redirect(signIn);

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
  if (response.status === 403) redirect('/auth/error?reason=email_unverified');
  if (response.status === 404 && CUSTOMER_LIST_PATHS.has(path)) {
    redirect('/auth/error?reason=access');
  }
  if (!response.ok) {
    throw new Error('This operation could not be completed. Please refresh and try again.');
  }

  return response.json() as Promise<T>;
}
