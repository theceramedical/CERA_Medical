import { canPublish, canReadDrafts } from '../access/roles.ts';

import type { CollectionConfig } from 'payload';

/**
 * Append-only audit of publish, unpublish, restore, and delete.
 *
 * No updates, no deletes for anyone except an administrator wiping a seed.
 * Editors can read the events for documents they can see; approvers and
 * administrators can read all of them. Anonymous cannot - this is the trail,
 * not a public changelog.
 */
export const AuditEvents: CollectionConfig = {
  slug: 'audit-events',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'targetId', 'actorSubjectId', 'createdAt'],
    group: 'Settings',
  },
  access: {
    // Creates go through afterChange hooks with `overrideAccess: true`. A
    // direct REST create is rejected. There is no beforeChange throw because
    // Payload hooks still run under overrideAccess, and that would block the
    // legitimate write.
    create: () => false,
    read: ({ req }) => canReadDrafts(req.user as never) || canPublish(req.user as never),
    update: () => false,
    delete: ({ req }) => req.user?.role === 'administrator',
  },
  fields: [
    { name: 'actorSubjectId', type: 'text' },
    { name: 'action', type: 'text', required: true },
    { name: 'targetType', type: 'text', required: true, defaultValue: 'content' },
    { name: 'targetId', type: 'text', required: true },
    { name: 'safeDiff', type: 'json' },
    { name: 'requestId', type: 'text', required: true },
  ],
  timestamps: true,
};
