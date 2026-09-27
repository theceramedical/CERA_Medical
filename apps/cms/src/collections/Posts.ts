import { asString } from '../lib/as-string.ts';
import { constrainedEditor } from '../lib/editor.ts';
import { PREVIEW_BREAKPOINTS, previewUrl } from '../lib/preview.ts';

import { publishable } from './publishable.ts';

import type { CollectionConfig } from 'payload';

export const Posts: CollectionConfig = publishable({
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', '_status', 'reviewRequested', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data }) => previewUrl(`/articles/${asString(data.slug)}`),
      breakpoints: [...PREVIEW_BREAKPOINTS],
    },
    preview: (data) => previewUrl(`/articles/${asString(data.slug)}`),
  },
  extraFields: [
    { name: 'excerpt', type: 'textarea', required: true, maxLength: 400 },
    { name: 'cover', type: 'relationship', relationTo: 'media' },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    { name: 'body', type: 'richText', required: true, editor: constrainedEditor() },
  ],
});
