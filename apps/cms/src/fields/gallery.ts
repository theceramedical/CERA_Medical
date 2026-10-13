import type { Field } from 'payload';

export const galleryFields: Field[] = [
  { name: 'galleryHeading', type: 'text', label: 'Gallery heading', maxLength: 160 },
  {
    name: 'gallery',
    label: 'Image gallery',
    type: 'upload',
    relationTo: 'media',
    hasMany: true,
    maxRows: 40,
    admin: {
      description:
        'Select multiple images and drag to reorder. For bulk uploads, open Content → Media and select or drop several files, complete their Alt text, then select them here. Removing a selection does not delete the original file.',
    },
  },
];
