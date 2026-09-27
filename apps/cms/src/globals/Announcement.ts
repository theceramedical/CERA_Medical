import { canAuthor } from '../access/roles.ts';

import type { GlobalConfig } from 'payload';

export const Announcement: GlobalConfig = {
  slug: 'announcement',
  admin: { group: 'Site' },
  access: {
    read: () => true,
    update: ({ req }) => canAuthor(req.user as never),
  },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: false },
    { name: 'message', type: 'text', maxLength: 200 },
    { name: 'href', type: 'text' },
  ],
};
