import { asString } from '../lib/as-string.ts';
import { constrainedEditor } from '../lib/editor.ts';
import { PREVIEW_BREAKPOINTS, previewUrl } from '../lib/preview.ts';

import { publishable } from './publishable.ts';

import type { CollectionConfig } from 'payload';

export const Policies: CollectionConfig = publishable({
  slug: 'policies',
  labels: { singular: 'Policy', plural: 'Policies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'versionLabel', '_status', 'reviewRequested', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data }) => previewUrl(`/${policyPath(asString(data.slug))}`),
      breakpoints: [...PREVIEW_BREAKPOINTS],
    },
    preview: (data) => previewUrl(`/${policyPath(asString(data.slug))}`),
  },
  extraFields: [
    { name: 'excerpt', type: 'textarea', maxLength: 400 },
    {
      name: 'effectiveDate',
      type: 'date',
      required: true,
      admin: { description: 'Shown as the document date. Changing it is a new version.' },
    },
    { name: 'versionLabel', type: 'text', required: true, defaultValue: 'draft' },
    { name: 'body', type: 'richText', required: true, editor: constrainedEditor() },
  ],
});

function policyPath(slug: string): string {
  if (slug === 'privacy-policy' || slug === 'privacy') return 'privacy';
  if (slug === 'terms-of-service' || slug === 'terms') return 'terms';
  if (slug === 'data-retention-policy') return 'data-retention';
  return slug;
}
