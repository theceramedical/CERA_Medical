import { PUBLISHED_CONSTRAINT, type PublishedConstraint } from './published.ts';
import { canAuthor, canPublish, canReadDrafts, isCmsUser, type CmsUser } from './roles.ts';

/**
 * CMS-102, as functions rather than as UI.
 *
 * Every cell in the phase document's matrix is one of these. The admin UI is a
 * client of the same functions the REST and GraphQL handlers call, so hiding a
 * Publish button is not a permission - refusing the write is.
 */

export type AccessResult = boolean | PublishedConstraint;

export interface AccessArgs {
  readonly user?: unknown;
  readonly data?: unknown;
}

function userOf(args: AccessArgs): CmsUser | null {
  return isCmsUser(args.user) ? args.user : null;
}

export function readAccess(args: AccessArgs): AccessResult {
  if (canReadDrafts(userOf(args))) return true;
  return PUBLISHED_CONSTRAINT;
}

export function createAccess(args: AccessArgs): boolean {
  return canAuthor(userOf(args));
}

export function updateAccess(args: AccessArgs): boolean {
  return canAuthor(userOf(args));
}

export function deleteAccess(args: AccessArgs): boolean {
  return canPublish(userOf(args));
}

/**
 * Version restore is a publish-shaped write: it can resurrect a previously
 * published body, so an editor must not be able to do it. Payload exposes this
 * as `versions.restore`.
 */
export function restoreAccess(args: AccessArgs): boolean {
  return canPublish(userOf(args));
}

/**
 * Field-level write on `approverId` and `publishedAt`.
 *
 * An editor who can set these can mark a draft as approved without going through
 * the publish hook. Read is open to anyone who can read the document - the values
 * are not secret, they are the audit of the two-person rule.
 */
export function publishFieldAccess(args: AccessArgs): boolean {
  return canPublish(userOf(args));
}

/** Access config reused by every publishable collection. */
export const documentAccess = {
  create: createAccess,
  read: readAccess,
  update: updateAccess,
  delete: deleteAccess,
  readVersions: (args: AccessArgs) => canReadDrafts(userOf(args)),
} as const;

/** Access config for records that have no draft (redirects, categories). */
export const staffWritePublishedRead = {
  create: createAccess,
  read: readAccess,
  update: updateAccess,
  delete: deleteAccess,
} as const;
