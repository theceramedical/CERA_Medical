import 'server-only';

import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function authenticatedApi<T>(
  path: string,
  options: { method?: string; body?: unknown; returnTo?: string } = {},
): Promise<T> {
  const returnTo = options.returnTo;
  const signInPath =
    returnTo === undefined ? '/auth/sign-in' : `/auth/sign-in?next=${encodeURIComponent(returnTo)}`;

  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) redirect(signInPath);
  const api = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!api) throw new Error('API is not configured');
  const response = await fetch(`${api.replace(/\/$/, '')}${path}`, {
    method: options.method ?? 'GET',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 401) redirect(signInPath);
  if (!response.ok)
    throw new Error('This operation could not be completed. Please refresh and try again.');
  return response.json() as Promise<T>;
}
