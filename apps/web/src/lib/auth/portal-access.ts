import 'server-only';

import { redirect } from 'next/navigation';

import { isStaffReturnTo, safeReturnTo } from './return-to.ts';
import { rolesIncludeStaff } from './staff-roles.ts';

import type { WebSession } from './session.ts';

export function signInPath(returnTo?: string): string {
  const path = safeReturnTo(returnTo ?? null, '/staff');
  const staffPath = isStaffReturnTo(path) ? path : '/staff';
  return `/auth/signin?next=${encodeURIComponent(staffPath)}`;
}

export function sessionHasStaffRole(session: WebSession): boolean {
  return rolesIncludeStaff(session.roles);
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
