import { createAccess, deleteAccess, updateAccess } from '../access/matrix.ts';
import { slugField } from '../fields/slug.ts';

import type { CollectionConfig } from 'payload';

/**
 * Article pills. Colour is a token name, never a hex value (ADR-001 rule 2).
 *
 * The public renderer maps the token through Tailwind; a hex stored here would
 * be a raw colour the `no-raw-color` lint cannot see, because it never passes
 * through a class name.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'colourToken', 'updatedAt'],
    group: 'Content',
  },
  access: {
    create: createAccess,
    // No drafts. A category is a label, and hiding it from the public API would
    // blank every pill on a published article.
    read: () => true,
    update: updateAccess,
    delete: deleteAccess,
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 40 },
    slugField,
    {
      name: 'colourToken',
      type: 'select',
      required: true,
      defaultValue: 'accent-fill',
      options: [
        { label: 'accent-fill', value: 'accent-fill' },
        { label: 'primary', value: 'primary' },
        { label: 'accent', value: 'accent' },
        { label: 'foreground', value: 'foreground' },
      ],
      admin: {
        description: 'A theme.css token, not a colour. The pill is drawn in that token.',
      },
    },
  ],
};
