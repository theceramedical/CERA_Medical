import 'server-only';

import { redirect } from 'next/navigation';

import { signInPath, verifyEmailPath } from './portal-api-paths.ts';
import { rolesIncludeStaff } from './staff-roles.ts';

import type { WebSession } from './session.ts';

export { apiPathRequiresVerifiedEmail, signInPath, verifyEmailPath } from './portal-api-paths.ts';

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
  if (emailVerified && !session.emailVerified) redirect(verifyEmailPath(returnTo));
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
