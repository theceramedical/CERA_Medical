import { type Role } from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

import { matchRoute } from './policies.ts';

import type { SessionClaims } from './session.ts';

export interface AuthorizeInput {
  readonly method: string;
  readonly path: string;
  readonly session: SessionClaims | null;
}

export type AuthorizeResult =
  | { ok: true; session: SessionClaims | null }
  | { ok: false; error: ApiError; reason: string };

/**
 * Deny by default. A path with no policy is unreachable even if a handler exists.
 */
export function authorize(input: AuthorizeInput): AuthorizeResult {
  const route = matchRoute(input.method, input.path);
  if (route === null) {
    return {
      ok: false,
      error: new ApiError('not_found'),
      reason: 'no_policy',
    };
  }

  if (route.policy.kind === 'public' || route.policy.kind === 'signature') {
    return { ok: true, session: input.session };
  }

  if (input.session === null) {
    return { ok: false, error: new ApiError('unauthenticated'), reason: 'missing_session' };
  }

  if (route.policy.kind === 'customer') {
    if (!input.session.roles.includes('customer')) {
      return { ok: false, error: new ApiError('not_found'), reason: 'role' };
    }
    if (route.policy.emailVerified && !input.session.emailVerified) {
      return { ok: false, error: new ApiError('forbidden'), reason: 'email_unverified' };
    }
    return { ok: true, session: input.session };
  }

  const allowed = route.policy.roles;
  if (!input.session.roles.some((role) => allowed.includes(role))) {
    return { ok: false, error: new ApiError('not_found'), reason: 'role' };
  }
  if (route.policy.mfa === true && !input.session.mfa) {
    return { ok: false, error: new ApiError('forbidden'), reason: 'mfa_required' };
  }
  return { ok: true, session: input.session };
}

export function requireRole(session: SessionClaims | null, roles: readonly Role[]): SessionClaims {
  if (session === null) throw new ApiError('unauthenticated');
  if (!session.roles.some((role) => roles.includes(role))) {
    throw new ApiError('not_found');
  }
  return session;
}

/**
 * Ownership is a SQL predicate, not a post-fetch check.
 */
export function ownershipPredicate(subjectId: string): { customerSubjectId: string } {
  return { customerSubjectId: subjectId };
}
