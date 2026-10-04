import {
  CATALOG_PRODUCTS,
  FEATURED_PRODUCT,
  productDetailPath,
} from '../content/products-catalog.ts';

import { FIXTURE_SERVICE_SLUGS } from './catalogue-fixtures.ts';
import { listPublishedDocuments } from './cms/client.ts';

import type { MetadataRoute } from 'next';

export interface IndexableSitemapEntry {
  readonly path: string;
  readonly lastModified?: Date;
  readonly changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'];
  readonly priority?: number;
}

const STATIC_ENTRIES: readonly IndexableSitemapEntry[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/services', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/products', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/articles', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/methodology', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/data-retention', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/faqs', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/enquiry', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/sitemap', priority: 0.3, changeFrequency: 'monthly' },
];

function policyPath(slug: string): string {
  if (slug === 'privacy-policy' || slug === 'privacy') return '/privacy';
  if (slug === 'terms-of-service' || slug === 'terms') return '/terms';
  if (slug === 'data-retention-policy') return '/data-retention';
  return `/${slug}`;
}

function parseDate(value: string | null | undefined): Date | undefined {
  if (value === null || value === undefined || value.length === 0) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function dedupeByPath(entries: readonly IndexableSitemapEntry[]): IndexableSitemapEntry[] {
  const byPath = new Map<string, IndexableSitemapEntry>();
  for (const entry of entries) {
    const existing = byPath.get(entry.path);
    if (existing === undefined) {
      byPath.set(entry.path, entry);
      continue;
    }
    const existingTime = existing.lastModified?.getTime() ?? 0;
    const nextTime = entry.lastModified?.getTime() ?? 0;
    if (nextTime > existingTime) byPath.set(entry.path, entry);
  }
  return [...byPath.values()];
}

/** Machine-readable sitemap rows for `sitemap.xml` (indexable URLs only). */
export async function listSitemapEntries(): Promise<readonly IndexableSitemapEntry[]> {
  const [posts, pages, presentations, policies] = await Promise.all([
    listPublishedDocuments('post').catch(() => []),
    listPublishedDocuments('page').catch(() => []),
    listPublishedDocuments('servicePresentation').catch(() => []),
    listPublishedDocuments('policy').catch(() => []),
  ]);

  const pageEntries: IndexableSitemapEntry[] = pages
    .filter((page) => page.slug !== 'home' && page.slug !== 'sitemap' && page.seo.noIndex !== true)
    .map((page) => {
      const lastModified = parseDate(page.updatedAt);
      return {
        path: `/${page.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        ...(lastModified === undefined ? {} : { lastModified }),
      };
    });

  const policyEntries: IndexableSitemapEntry[] = policies
    .filter((policy) => policy.seo.noIndex !== true)
    .map((policy) => {
      const lastModified = parseDate(policy.updatedAt);
      return {
        path: policyPath(policy.slug),
        changeFrequency: 'yearly' as const,
        priority: 0.4,
        ...(lastModified === undefined ? {} : { lastModified }),
      };
    });

  const serviceSlugs = [
    ...new Set([...FIXTURE_SERVICE_SLUGS, ...presentations.map((service) => service.slug)]),
  ];
  const presentationBySlug = new Map(presentations.map((row) => [row.slug, row]));
  const serviceEntries: IndexableSitemapEntry[] = serviceSlugs
    .filter((slug) => presentationBySlug.get(slug)?.seo.noIndex !== true)
    .map((slug) => {
      const lastModified = parseDate(presentationBySlug.get(slug)?.updatedAt);
      return {
        path: `/services/${slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        ...(lastModified === undefined ? {} : { lastModified }),
      };
    });

  const articleEntries: IndexableSitemapEntry[] = posts
    .filter((post) => post.seo.noIndex !== true)
    .map((post) => {
      const lastModified = parseDate(post.updatedAt);
      return {
        path: `/articles/${post.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        ...(lastModified === undefined ? {} : { lastModified }),
      };
    });

  const productSkus = [FEATURED_PRODUCT.sku, ...CATALOG_PRODUCTS.map((product) => product.sku)];
  const productEntries: IndexableSitemapEntry[] = [...new Set(productSkus)].map((sku) => ({
    path: productDetailPath(sku),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  return dedupeByPath([
    ...STATIC_ENTRIES,
    ...pageEntries,
    ...policyEntries,
    ...serviceEntries,
    ...articleEntries,
    ...productEntries,
  ]);
}
