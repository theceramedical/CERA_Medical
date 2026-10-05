import 'server-only';

import { redirect } from 'next/navigation';

import { signInPath } from './portal-api-paths.ts';

import type { WebSession } from './session.ts';

export { apiPathRequiresVerifiedEmail, signInPath } from './portal-api-paths.ts';

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
