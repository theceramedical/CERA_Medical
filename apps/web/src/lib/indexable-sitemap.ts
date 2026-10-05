import { listPublicServicesForIndex } from './catalogue/client.ts';
import { listPublishedDocumentsForSitemap } from './cms/client.ts';
import { listIndexableProductSkus } from './indexable-products.ts';
import {
  buildArticleSitemapEntries,
  buildCmsPageSitemapEntries,
  buildPolicySitemapEntries,
  buildProductSitemapEntries,
  buildServiceSitemapEntries,
  dedupeSitemapByPath,
  indexableServiceSlugs,
  STATIC_SITEMAP_ENTRIES,
  type IndexableSitemapEntry,
} from './indexable-sitemap-builders.ts';

export type { IndexableSitemapEntry } from './indexable-sitemap-builders.ts';

/**
 * Indexable URLs for `sitemap.xml` and the HTML sitemap.
 *
 * - Static marketing routes (about, contact, …) are always listed.
 * - CMS pages, articles, policies, and service presentations come from Payload
 *   when published and not marked no index.
 * - Service detail URLs follow the live catalogue API plus any CMS-only
 *   presentations (new Vendure services appear after the catalogue cache TTL).
 * - Product detail URLs merge the marketing catalog with `GET /v1/products`
 *   (Vendure `physical-products` collection).
 */
export async function listSitemapEntries(): Promise<readonly IndexableSitemapEntry[]> {
  const [posts, pages, presentations, policies, catalogue, productSkus] = await Promise.all([
    listPublishedDocumentsForSitemap('post').catch(() => []),
    listPublishedDocumentsForSitemap('page').catch(() => []),
    listPublishedDocumentsForSitemap('servicePresentation').catch(() => []),
    listPublishedDocumentsForSitemap('policy').catch(() => []),
    listPublicServicesForIndex().catch(() => ({ items: [], degraded: true })),
    listIndexableProductSkus().catch(() => []),
  ]);

  const serviceSlugs = indexableServiceSlugs(catalogue.items, presentations);

  return dedupeSitemapByPath([
    ...STATIC_SITEMAP_ENTRIES,
    ...buildCmsPageSitemapEntries(pages),
    ...buildPolicySitemapEntries(policies),
    ...buildServiceSitemapEntries(serviceSlugs, presentations),
    ...buildArticleSitemapEntries(posts),
    ...buildProductSitemapEntries(productSkus),
  ]);
}
