import { layoutBlocks } from '../blocks/layout.ts';
import { asString } from '../lib/as-string.ts';
import { constrainedEditor } from '../lib/editor.ts';
import { PREVIEW_BREAKPOINTS, previewUrl } from '../lib/preview.ts';

import { publishable } from './publishable.ts';

import type { CollectionConfig } from 'payload';

export const Pages: CollectionConfig = publishable({
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'reviewRequested', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data }) => previewUrl(`/${asString(data.slug)}`),
      breakpoints: [...PREVIEW_BREAKPOINTS],
    },
    preview: (data) => previewUrl(`/${asString(data.slug)}`),
  },
  extraFields: [
    { name: 'excerpt', type: 'textarea', maxLength: 400 },
    {
      name: 'layout',
      type: 'blocks',
      blocks: layoutBlocks,
      admin: {
        description:
          'Build pages from approved, accessible sections. Every available block is rendered on the public site.',
      },
    },
    { name: 'body', type: 'richText', editor: constrainedEditor() },
  ],
});
