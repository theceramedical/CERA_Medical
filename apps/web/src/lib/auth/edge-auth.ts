import 'server-only';

import { RoleSchema, type Role } from '@cera/contracts';
import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { CompactEncrypt } from 'jose';

import { sessionKey } from './oidc.ts';

import type { WebSession } from './session.ts';

export interface EdgeAuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: 'owner' | 'staff' | 'customer';
  readonly emailVerified?: boolean;
}

export function rolesForEdgeUser(role: 'owner' | 'staff' | 'customer'): readonly Role[] {
  if (role === 'owner') {
    return [
      'administrator',
      'operations_manager',
      'enquiry_handler',
      'content_editor',
      'content_approver',
      'auditor',
      'customer',
    ];
  }
  if (role === 'staff') {
    return ['enquiry_handler', 'operations_manager', 'content_editor'];
  }
  return ['customer'];
}

/**
 * Creates an encrypted session cookie value recognized by getSession() and all staff portals.
 */
export async function createEdgeSessionToken(user: EdgeAuthUser): Promise<string> {
  const roles = rolesForEdgeUser(user.role);
  roles.forEach((r) => RoleSchema.parse(r));

  const isStaffOrOwner = user.role === 'owner' || user.role === 'staff';
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (isStaffOrOwner ? 8 * 60 * 60 : 7 * 24 * 60 * 60); // 8 hours for staff/owner, 7 days for customer

  const sessionPayload: WebSession & { exp: number; absoluteExp: number; iat: number } = {
    sub: user.id,
    email: user.email,
    emailVerified: user.emailVerified ?? true,
    roles,
    mfa: true,
    iat: now,
    exp,
    absoluteExp: exp,
  };

  return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(sessionPayload)))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(sessionKey());
}

/**
 * Cookie options for setting SESSION_COOKIE_NAME on the domain.
 */
export function edgeSessionCookieOptions(userRole: 'owner' | 'staff' | 'customer') {
  const isStaffOrOwner = userRole === 'owner' || userRole === 'staff';
  const maxAge = isStaffOrOwner ? 8 * 60 * 60 : 7 * 24 * 60 * 60;

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export { SESSION_COOKIE_NAME };
