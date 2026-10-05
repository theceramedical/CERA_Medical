import 'server-only';

import { redirect } from 'next/navigation';

import { signInPath } from './portal-api-paths.ts';
import { rolesIncludeStaff } from './staff-roles.ts';

import type { WebSession } from './session.ts';

export { apiPathRequiresVerifiedEmail, signInPath } from './portal-api-paths.ts';

export function sessionHasStaffRole(session: WebSession): boolean {
  return rolesIncludeStaff(session.roles);
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

export function assertStaffPortalSession(
  session: WebSession | null,
  options: { returnTo?: string } = {},
): WebSession {
  const { returnTo } = options;
  if (session === null) redirect(signInPath(returnTo));
  if (!sessionHasStaffRole(session)) redirect('/auth/error?reason=access');
  return session;
}
