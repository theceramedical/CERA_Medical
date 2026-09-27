import { createAccess, deleteAccess, updateAccess } from '../access/matrix.ts';

import type { CollectionConfig } from 'payload';

/**
 * Consumed by `apps/web` in Phase 07.
 *
 * Readable anonymously so the web app can fetch the list server-side without a
 * staff session. Writes stay with authors. A redirect that is wrong is a
 * published fact, so we do not draft these - a draft redirect that 404s is not
 * a previewable thing.
 */
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'permanent', 'updatedAt'],
    group: 'Settings',
  },
  access: {
    create: createAccess,
    read: () => true,
    update: updateAccess,
    delete: deleteAccess,
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      validate: (value: unknown) =>
        typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
          ? true
          : 'Must be a single-origin path, for example /old-page.',
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      validate: (value: unknown) =>
        typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
          ? true
          : 'Must be a single-origin path. Protocol-relative targets are an open redirect.',
    },
    { name: 'permanent', type: 'checkbox', defaultValue: true },
  ],
};
