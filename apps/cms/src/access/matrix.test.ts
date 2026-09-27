import { describe, expect, it } from 'vitest';

import type { Role } from '@cera/contracts';

import {
  createAccess,
  deleteAccess,
  publishFieldAccess,
  readAccess,
  restoreAccess,
  updateAccess,
} from './matrix.ts';
import { PUBLISHED_CONSTRAINT } from './published.ts';

import type { CmsUser } from './roles.ts';

function user(role: Role, id = role): CmsUser {
  return { id, role };
}

/**
 * The phase-05 matrix, as assertions.
 *
 * Roles that the phase document does not name (customer, enquiry_handler, auditor)
 * are treated as Operations Support: published read, no writes. That is the safe
 * default - a role added later without an explicit grant sees only what a stranger
 * sees, plus whatever the API already lets them see.
 */
const ROLES: readonly Role[] = [
  'customer',
  'content_editor',
  'content_approver',
  'enquiry_handler',
  'operations_manager',
  'administrator',
  'auditor',
];

describe('CMS-102 access matrix', () => {
  describe('anonymous', () => {
    it('reads published only, as a constraint, not a boolean', () => {
      // A boolean `true` here is the draft leak. See published.ts.
      expect(readAccess({ user: null })).toEqual(PUBLISHED_CONSTRAINT);
      expect(readAccess({})).toEqual(PUBLISHED_CONSTRAINT);
    });

    it('cannot write', () => {
      expect(createAccess({})).toBe(false);
      expect(updateAccess({})).toBe(false);
      expect(deleteAccess({})).toBe(false);
      expect(restoreAccess({})).toBe(false);
      expect(publishFieldAccess({})).toBe(false);
    });
  });

  it.each(ROLES)('covers %s from RoleSchema', (role) => {
    const actor = user(role);
    const canDraft =
      role === 'content_editor' || role === 'content_approver' || role === 'administrator';
    const canShip = role === 'content_approver' || role === 'administrator';

    expect(createAccess({ user: actor })).toBe(canDraft);
    expect(updateAccess({ user: actor })).toBe(canDraft);
    expect(readAccess({ user: actor })).toEqual(canDraft ? true : PUBLISHED_CONSTRAINT);
    expect(deleteAccess({ user: actor })).toBe(canShip);
    expect(restoreAccess({ user: actor })).toBe(canShip);
    expect(publishFieldAccess({ user: actor })).toBe(canShip);
  });

  it('does not let an editor publish by writing approverId', () => {
    expect(publishFieldAccess({ user: user('content_editor') })).toBe(false);
    expect(publishFieldAccess({ user: user('content_approver') })).toBe(true);
  });
});
