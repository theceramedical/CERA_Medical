import 'server-only';

import { redirect } from 'next/navigation';

import type { WebSession } from './session.ts';

/** Paths that require a verified email before the API will respond. */
const VERIFIED_EMAIL_API_PREFIXES = [
  '/v1/me/enquiries',
  '/v1/me/orders',
  '/v1/enquiries/claim/',
] as const;

export function apiPathRequiresVerifiedEmail(path: string): boolean {
  return VERIFIED_EMAIL_API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

export function signInPath(returnTo?: string): string {
  return returnTo === undefined
    ? '/auth/sign-in'
    : `/auth/sign-in?next=${encodeURIComponent(returnTo)}`;
}

export function assertCustomerPortalSession(
  session: WebSession | null,
  options: { returnTo?: string; emailVerified?: boolean } = {},
): WebSession {
  const { returnTo, emailVerified = false } = options;
  if (session === null) redirect(signInPath(returnTo));
  if (!session.roles.includes('customer')) redirect('/auth/error?reason=access');
  if (emailVerified && !session.emailVerified) redirect('/auth/error?reason=email_unverified');
  return session;
}
