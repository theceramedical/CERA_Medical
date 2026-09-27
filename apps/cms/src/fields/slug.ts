import type { Field } from 'payload';

export const slugField: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Lower-case, hyphenated. Becomes the public URL.',
  },
  validate: (value: unknown) => {
    if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      return 'Use a lowercase slug: letters, numbers, hyphens.';
    }
    return true;
  },
};
