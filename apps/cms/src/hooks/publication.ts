import { APIError } from 'payload';

import { canPublish, isCmsUser } from '../access/roles.ts';

/**
 * Rejects a publication-status change from anyone who is not an approver.
 *
 * Payload's admin UI hides the Publish button from roles without `update` on
 * `_status`, but REST and GraphQL do not. An editor who `PATCH`es
 * `{ "_status": "published" }` would succeed if the only defence was the button.
 * This hook is the defence, and it is why CMS-102 is a permissions requirement
 * rather than a UI one.
 *
 * Also fills `approverId` and `publishedAt` on a successful publish, so those
 * columns cannot be set independently of the status change (the field-level
 * access on them is the other half of the same rule).
 */

export class PublicationForbiddenError extends APIError {
  constructor(action: 'publish' | 'unpublish') {
    super(`Only a content approver or administrator can ${action}.`, 403);
    this.name = 'PublicationForbiddenError';
  }
}

export interface PublicationInput {
  readonly _status?: 'draft' | 'published';
  readonly approverId?: string | null;
  readonly publishedAt?: string | null;
}

export interface PublicationDecision {
  readonly data: PublicationInput;
  readonly action: 'publish' | 'unpublish' | 'none';
}

export function applyPublicationRules(options: {
  readonly user: unknown;
  readonly incoming: PublicationInput;
  readonly existing?: PublicationInput;
  /**
   * Local-API seed and migrate paths. REST and GraphQL never set this; they
   * always have `payloadAPI !== 'local'` or an authenticated `req.user`.
   */
  readonly system?: boolean;
}): PublicationDecision {
  const next = options.incoming._status ?? options.existing?._status ?? 'draft';
  const previous = options.existing?._status ?? 'draft';
  const actor = isCmsUser(options.user) ? options.user : null;
  const privileged = options.system === true || canPublish(actor);

  if (next === 'published' && previous !== 'published') {
    if (!privileged) throw new PublicationForbiddenError('publish');

    return {
      action: 'publish',
      data: {
        ...options.incoming,
        _status: 'published',
        approverId: actor === null ? null : String(actor.id),
        publishedAt: options.incoming.publishedAt ?? new Date().toISOString(),
      },
    };
  }

  if (next === 'draft' && previous === 'published') {
    if (!privileged) throw new PublicationForbiddenError('unpublish');

    return {
      action: 'unpublish',
      data: {
        ...options.incoming,
        _status: 'draft',
      },
    };
  }

  return { action: 'none', data: options.incoming };
}
