import { describe, expect, it } from 'vitest';

import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

import { buildProductSitemapEntries, indexableServiceSlugs } from './indexable-sitemap-builders.ts';

function publicService(slug: string): PublicService {
  return {
    slug,
    title: slug,
    summary: '',
    description: '',
    category: null,
    displayPrice: null,
    availabilityText: null,
    enquiryEnabled: true,
    listPriceMinor: null,
    checkoutEnabled: false,
    mediaId: null,
    imageUrl: null,
  };
}

function presentation(slug: string, noIndex = false): ContentDocument {
  return {
    id: `id-${slug}`,
    type: 'servicePresentation',
    slug,
    title: slug,
    excerpt: null,
    body: {},
    seo: {
      title: null,
      description: null,
      canonicalUrl: null,
      ogImageId: null,
      noIndex,
    },
    mediaIds: [],
    status: 'published',
    authorId: null,
    approverId: null,
    publishedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
}

describe('indexableServiceSlugs', () => {
  it('includes catalogue services and drops CMS noIndex', () => {
    const slugs = indexableServiceSlugs(
      [publicService('new-assay')],
      [presentation('new-assay'), presentation('cms-only'), presentation('hidden', true)],
    );
    expect(slugs).toEqual(['cms-only', 'new-assay']);
  });
});

describe('buildProductSitemapEntries', () => {
  it('normalises SKU paths', () => {
    const entries = buildProductSitemapEntries(['CR-CEL-8402', 'cr-cel-8402']);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.path).toBe('/products/cr-cel-8402');
  });
});
