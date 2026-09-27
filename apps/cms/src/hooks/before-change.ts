import { applyPublicationRules } from './publication.ts';

import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Wired on every publishable collection.
 *
 * Stamps `authorId` on first create (so a document always has one, even if the
 * editor never opened the sidebar) and runs the publish/unpublish gate. The
 * gate throws `PublicationForbiddenError`, which Payload surfaces as a 403.
 */
export const publicationBeforeChange: CollectionBeforeChangeHook = ({ data, req, originalDoc }) => {
  const incoming = data as {
    _status?: 'draft' | 'published';
    approverId?: string | null;
    publishedAt?: string | null;
    authorId?: string | null;
  };

  incoming.authorId ??= typeof req.user?.id === 'string' ? req.user.id : null;

  const existing =
    originalDoc === undefined || originalDoc === null
      ? undefined
      : (originalDoc as { _status?: 'draft' | 'published' });

  // Payload types `req.user` as always present once generated types exist; the
  // seed path is a local-API call with no actor. Cast so the empty case is
  // visible to us and not "impossible" to the checker.
  const actor = req.user as unknown;
  const unauthenticated = actor === undefined || actor === null;

  const decision = applyPublicationRules({
    user: req.user,
    incoming,
    system: req.payloadAPI === 'local' && unauthenticated,
    ...(existing === undefined ? {} : { existing }),
  });

  return { ...data, ...decision.data };
};
