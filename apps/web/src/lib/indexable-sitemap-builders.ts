import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

import { productDetailPath } from '../content/products-catalog.ts';

import type { MetadataRoute } from 'next';

export interface IndexableSitemapEntry {
  readonly path: string;
  readonly lastModified?: Date;
  readonly changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'];
  readonly priority?: number;
}

export const STATIC_SITEMAP_ENTRIES: readonly IndexableSitemapEntry[] = [
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

export function policyPath(slug: string): string {
  if (slug === 'privacy-policy' || slug === 'privacy') return '/privacy';
  if (slug === 'terms-of-service' || slug === 'terms') return '/terms';
  if (slug === 'data-retention-policy') return '/data-retention';
  return `/${slug}`;
}

export function parseIndexableDate(value: string | null | undefined): Date | undefined {
  if (value === null || value === undefined || value.length === 0) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function dedupeSitemapByPath(
  entries: readonly IndexableSitemapEntry[],
): IndexableSitemapEntry[] {
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

/** Slugs with a live catalogue row and/or CMS presentation, respecting CMS noIndex. */
export function indexableServiceSlugs(
  catalogue: readonly PublicService[],
  presentations: readonly ContentDocument[],
): string[] {
  const presentationBySlug = new Map(presentations.map((row) => [row.slug, row]));
  const slugs = new Set<string>();
  for (const service of catalogue) {
    if (presentationBySlug.get(service.slug)?.seo.noIndex === true) continue;
    slugs.add(service.slug);
  }
  for (const presentation of presentations) {
    if (presentation.seo.noIndex === true) continue;
    slugs.add(presentation.slug);
  }
  return [...slugs].sort((a, b) => a.localeCompare(b));
}

export function buildServiceSitemapEntries(
  slugs: readonly string[],
  presentations: readonly ContentDocument[],
): IndexableSitemapEntry[] {
  const presentationBySlug = new Map(presentations.map((row) => [row.slug, row]));
  return slugs.map((slug) => {
    const lastModified = parseIndexableDate(presentationBySlug.get(slug)?.updatedAt);
    return {
      path: `/services/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      ...(lastModified === undefined ? {} : { lastModified }),
    };
  });
}

export function buildProductSitemapEntries(
  productSkus: readonly string[],
): IndexableSitemapEntry[] {
  return [...new Set(productSkus.map((sku) => sku.toLowerCase()))].map((sku) => ({
    path: productDetailPath(sku),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));
}

export function buildCmsPageSitemapEntries(
  pages: readonly ContentDocument[],
): IndexableSitemapEntry[] {
  return pages
    .filter((page) => page.slug !== 'home' && page.slug !== 'sitemap' && page.seo.noIndex !== true)
    .map((page) => {
      const lastModified = parseIndexableDate(page.updatedAt);
      return {
        path: `/${page.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        ...(lastModified === undefined ? {} : { lastModified }),
      };
    });
}

export function buildPolicySitemapEntries(
  policies: readonly ContentDocument[],
): IndexableSitemapEntry[] {
  return policies
    .filter((policy) => policy.seo.noIndex !== true)
    .map((policy) => {
      const lastModified = parseIndexableDate(policy.updatedAt);
      return {
        path: policyPath(policy.slug),
        changeFrequency: 'yearly' as const,
        priority: 0.4,
        ...(lastModified === undefined ? {} : { lastModified }),
      };
    });
}

export function buildArticleSitemapEntries(
  posts: readonly ContentDocument[],
): IndexableSitemapEntry[] {
  return posts
    .filter((post) => post.seo.noIndex !== true)
    .map((post) => {
      const lastModified = parseIndexableDate(post.updatedAt);
      return {
        path: `/articles/${post.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        ...(lastModified === undefined ? {} : { lastModified }),
      };
    });
}
