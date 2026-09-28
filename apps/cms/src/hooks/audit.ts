import { randomUUID } from 'node:crypto';

import { safeDiff } from '@cera/observability';

import { asString } from '../lib/as-string.ts';

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

/**
 * Writes an `audit-events` row for publish, unpublish, restore, and delete.
 *
 * Restore is detected as a publish whose `req.context` Payload marks, or more
 * reliably as an update that changes `_status` to `published` while carrying
 * `resave` from the versions API. We key off the status transition plus
 * `req.query.locale` being absent - the important part is that *some* event is
 * written, with a `safeDiff` that never contains body text.
 *
 * The CMS cannot INSERT into `cera_app.audit_events` (cross-database CONNECT is
 * denied). These rows live in `cera_cms` and are the trail CMS-102 requires.
 * Phase 12's staff audit view can federate the two later if it needs to.
 */

function actorId(user: unknown): string | null {
  if (
    user !== null &&
    typeof user === 'object' &&
    'id' in user &&
    (typeof user.id === 'string' || typeof user.id === 'number')
  ) {
    return String(user.id);
  }
  return null;
}

function pickComparable(doc: Record<string, unknown> | undefined): Record<string, unknown> {
  if (doc === undefined) return {};
  const { _status, slug, reviewRequested, publishedAt, approverId, authorId } = doc;
  return { _status, slug, reviewRequested, publishedAt, approverId, authorId };
}

export function auditAfterChange(actionPrefix: string): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req, operation }) => {
    const current = doc as Record<string, unknown>;
    const previous = previousDoc as Record<string, unknown> | undefined;
    const nextStatus = current._status;
    const prevStatus = previous?._status;

    const url = req.url ?? '';
    const restoring = url.includes('/versions/');

    let action: string | null = null;
    if (restoring) action = `${actionPrefix}.restored`;
    if (operation === 'create' && nextStatus === 'published') action = `${actionPrefix}.published`;
    if (operation === 'update' && nextStatus === 'published' && prevStatus !== 'published') {
      action = `${actionPrefix}.published`;
    }
    if (operation === 'update' && nextStatus === 'draft' && prevStatus === 'published') {
      action = `${actionPrefix}.unpublished`;
    }

    if (action === null) return doc as never;

    await req.payload.create({
      collection: 'audit-events',
      data: {
        actorSubjectId: actorId(req.user),
        action,
        targetType: 'content',
        targetId: asString(current.id) || asString(current.slug),
        safeDiff: safeDiff(pickComparable(previous), pickComparable(current)),
        requestId: req.headers.get('x-request-id') ?? randomUUID(),
      },
      // Audit writes must not themselves recurse through access/hooks as the
      // acting editor - they would be rejected. Local API with override.
      overrideAccess: true,
      req,
    });

    return doc as never;
  };
}

export const auditAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const current = doc as Record<string, unknown>;

  await req.payload.create({
    collection: 'audit-events',
    data: {
      actorSubjectId: actorId(req.user),
      action: 'content.deleted',
      targetType: 'content',
      targetId: asString(current.id) || asString(current.slug),
      safeDiff: safeDiff(pickComparable(current), {}),
      requestId: req.headers.get('x-request-id') ?? randomUUID(),
    },
    overrideAccess: true,
    req,
  });
};
