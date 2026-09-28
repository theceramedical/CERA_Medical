import { canAuthor } from '../access/roles.ts';

import type { GlobalConfig } from 'payload';

const linkFields = [
  { name: 'label', type: 'text' as const, required: true, maxLength: 40 },
  { name: 'href', type: 'text' as const, required: true, maxLength: 200 },
];

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: { group: 'Site' },
  access: {
    read: () => true,
    update: ({ req }) => canAuthor(req.user),
  },
  fields: [
    { name: 'header', type: 'array', fields: linkFields, maxRows: 8 },
    { name: 'footer', type: 'array', fields: linkFields, maxRows: 16 },
  ],
};
