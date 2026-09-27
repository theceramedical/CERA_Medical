import { documentAccess } from '../access/matrix.ts';

import type { CollectionConfig } from 'payload';

/**
 * Editorial media.
 *
 * Alt text is required. An upload without it cannot be saved, which is the only
 * reliable way to keep decorative-versus-meaningful honest: a placeholder
 * "image" alt that someone meant to come back to is how a page ships describing
 * a photograph that is not there, or worse, describing nothing next to a
 * photograph that is.
 *
 * Sizes match the reference: hero portrait 640×800, article card 640×360, OG
 * 1200×630. The public renderer asks for these by name rather than inventing
 * its own.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    group: 'Content',
  },
  access: {
    ...documentAccess,
    // Media has no `_status`. Anonymous read is the files themselves, via the
    // public S3 URL; the API still requires a published parent document to
    // mention them. Creating still needs an author.
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    imageSizes: [
      { name: 'hero', width: 640, height: 800, position: 'centre' },
      { name: 'card', width: 640, height: 360, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'card',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        const size = typeof data?.filesize === 'number' ? data.filesize : 0;
        if (size > 10 * 1024 * 1024) {
          throw new Error('Media files cannot exceed 10MB.');
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      minLength: 1,
      maxLength: 200,
      admin: {
        description:
          'Required. Describe the image for someone who cannot see it. Decorative images still need a short honest label, not an empty string.',
      },
    },
  ],
};
