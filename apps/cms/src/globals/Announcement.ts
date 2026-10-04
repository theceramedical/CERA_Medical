import { canAuthor } from '../access/roles.ts';

import type { GlobalConfig } from 'payload';

export const Announcement: GlobalConfig = {
  slug: 'announcement',
  admin: { group: 'Site' },
  access: {
    read: () => true,
    update: ({ req }) => canAuthor(req.user),
  },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: false },
    {
      name: 'statusLabel',
      type: 'text',
      maxLength: 48,
      admin: { description: 'Short label beside the pulse indicator (e.g. Lab accredited).' },
    },
    {
      name: 'message',
      type: 'text',
      maxLength: 240,
      admin: { description: 'Supporting line shown from tablet width upward.' },
    },
    {
      name: 'href',
      type: 'text',
      admin: { description: 'Optional link target (e.g. /methodology).' },
    },
    {
      name: 'linkLabel',
      type: 'text',
      maxLength: 80,
      admin: { description: 'Optional link text (e.g. Review protocol standards).' },
    },
  ],
};
