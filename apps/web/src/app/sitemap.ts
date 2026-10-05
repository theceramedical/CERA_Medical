import { listSitemapEntries } from '../lib/indexable-sitemap.ts';
import { siteUrl } from '../lib/site-url.ts';

import type { MetadataRoute } from 'next';

/** Refresh with catalogue reads and CMS cache tags (see `lib/indexable-sitemap.ts`). */
export const revalidate = 30;

/**
 * Indexable routes only. Search, preview, account, staff, and /dev stay out.
 * Drafts never appear because listPublishedDocuments filters them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const entries = await listSitemapEntries();

  return entries.map((entry) => ({
    url: new URL(entry.path, origin).toString(),
    ...(entry.lastModified !== undefined ? { lastModified: entry.lastModified } : {}),
    ...(entry.changeFrequency !== undefined ? { changeFrequency: entry.changeFrequency } : {}),
    ...(entry.priority !== undefined ? { priority: entry.priority } : {}),
  }));
}
