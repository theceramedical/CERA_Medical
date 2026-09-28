import type { Role } from '@cera/contracts';

/**
 * The user shape access functions actually read.
 *
 * Payload's generated `User` type arrives after the first `payload generate:types`
 * and is wider than this. Access decisions depend on `id` and `role` only, so
 * the functions take this narrower type and stay testable without booting Payload.
 */
export interface CmsUser {
  readonly id: string | number;
  readonly role: Role;
}

export function isCmsUser(value: unknown): value is CmsUser {
  if (value === null || typeof value !== 'object') return false;
  if (!('id' in value) || (typeof value.id !== 'string' && typeof value.id !== 'number'))
    return false;
  if (!('role' in value) || typeof value.role !== 'string') return false;
  return true;
}

/** The two roles that may publish, unpublish, restore, and delete. */
export function canPublish(user: CmsUser | null | undefined): boolean {
  return user?.role === 'content_approver' || user?.role === 'administrator';
}

/**
 * Editors, approvers, and administrators.
 *
 * An approver can also draft: the two-person rule is about *publishing*, not
 * about who is allowed to type. Forcing an approver to log in as an editor to
 * fix a typo is how the rule gets a workaround.
 */
export function canAuthor(user: CmsUser | null | undefined): boolean {
  return user?.role === 'content_editor' || canPublish(user);
}

/**
 * Roles that may see drafts.
 *
 * Operations support, enquiry handlers, auditors, and anonymous visitors see
 * published records only. An auditor reading drafts would be reading unpublished
 * clinical copy they have no operational reason to see.
 */
export function canReadDrafts(user: CmsUser | null | undefined): boolean {
  return canAuthor(user);
}
