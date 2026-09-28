import { canAuthor } from '../access/roles.ts';

import type { GlobalConfig } from 'payload';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Site' },
  access: {
    read: () => true,
    update: ({ req }) => canAuthor(req.user),
  },
  fields: [
    { name: 'tagline', type: 'text', defaultValue: 'Better Information. Healthier Lives.' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'textarea' },
    {
      name: 'social',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
      maxRows: 8,
    },
    { name: 'newsletterHeading', type: 'text', defaultValue: 'Subscribe to Our Newsletter' },
    {
      name: 'newsletterBody',
      type: 'text',
      defaultValue: 'Get the latest health insights and updates.',
    },
  ],
};
