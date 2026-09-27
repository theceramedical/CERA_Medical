import { asString } from '../lib/as-string.ts';
import { assertServiceExists, CatalogueUnavailableError, vendureHasSlug } from '../lib/catalogue.ts';
import { constrainedEditor } from '../lib/editor.ts';
import { PREVIEW_BREAKPOINTS, previewUrl } from '../lib/preview.ts';

import { publishable } from './publishable.ts';

import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';

const assertCatalogue: CollectionBeforeChangeHook = async ({ data }) => {
  const slug = typeof data.slug === 'string' ? data.slug : '';
  const shop = process.env.VENDURE_SHOP_API_URL;
  const lookup =
    shop === undefined || shop.length === 0
      ? undefined
      : async (candidate: string) => {
          const live = await vendureHasSlug(shop, candidate);
          if (live === null) throw new CatalogueUnavailableError();
          return live;
        };

  await assertServiceExists(slug, lookup);
  if (typeof data.serviceId !== 'string' || data.serviceId.length === 0) {
    data.serviceId = slug;
  }
  return data;
};

export const ServicePresentations: CollectionConfig = publishable({
  slug: 'service-presentations',
  labels: { singular: 'Service presentation', plural: 'Service presentations' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'serviceId', '_status', 'reviewRequested', 'updatedAt'],
    group: 'Content',
    livePreview: {
      url: ({ data }) => previewUrl(`/services/${asString(data.slug)}`),
      breakpoints: [...PREVIEW_BREAKPOINTS],
    },
    preview: (data) => previewUrl(`/services/${asString(data.slug)}`),
  },
  extraHooks: { beforeChange: [assertCatalogue] },
  extraFields: [
    {
      name: 'serviceId',
      type: 'text',
      required: true,
      admin: {
        description:
          'Vendure product id, or the slug until Phase 06. Validated against the live catalogue on save.',
      },
    },
    { name: 'excerpt', type: 'textarea', maxLength: 400 },
    { name: 'body', type: 'richText', required: true, editor: constrainedEditor() },
  ],
});
