import { findCatalogEntry, productDetailPath } from '../content/products-catalog.ts';

import { listPublicProducts, listPublicServicesForIndex } from './catalogue/client.ts';
import { listPublishedDocumentsForSitemap } from './cms/client.ts';
import { listIndexableProductSkus } from './indexable-products.ts';
import {
  indexableServiceSlugs,
  policyPath,
  STATIC_SITEMAP_ENTRIES,
} from './indexable-sitemap-builders.ts';
import { listSitemapEntries } from './indexable-sitemap.ts';

export interface SitemapLink {
  readonly href: string;
  readonly label: string;
}

/** Paths for `sitemap.xml` and the HTML sitemap page — published, indexable routes only. */
export async function listIndexablePaths(): Promise<readonly string[]> {
  const entries = await listSitemapEntries();
  return entries.map((entry) => entry.path).sort((a, b) => a.localeCompare(b));
}

export async function listIndexableLinks(): Promise<readonly SitemapLink[]> {
  const [posts, pages, presentations, policies, catalogue, productSkus, catalogueProducts] =
    await Promise.all([
      listPublishedDocumentsForSitemap('post').catch(() => []),
      listPublishedDocumentsForSitemap('page').catch(() => []),
      listPublishedDocumentsForSitemap('servicePresentation').catch(() => []),
      listPublishedDocumentsForSitemap('policy').catch(() => []),
      listPublicServicesForIndex().catch(() => ({ items: [], degraded: true })),
      listIndexableProductSkus().catch(() => []),
      listPublicProducts({ revalidateSeconds: 30 }).catch(() => ({ items: [], degraded: true })),
    ]);
  const catalogueProductTitle = new Map(
    catalogueProducts.items.map((row) => [row.sku.toLowerCase(), row.title]),
  );

  const staticLinks: SitemapLink[] = STATIC_SITEMAP_ENTRIES.map((entry) => ({
    href: entry.path,
    label: staticLabel(entry.path),
  }));

  const pageLinks: SitemapLink[] = pages
    .filter((page) => page.slug !== 'home' && page.slug !== 'sitemap' && page.seo.noIndex !== true)
    .map((page) => ({ href: `/${page.slug}`, label: page.title }));

  const policyLinks: SitemapLink[] = policies
    .filter((policy) => policy.seo.noIndex !== true)
    .map((policy) => ({
      href: policyPath(policy.slug),
      label: policy.title,
    }));

  const serviceSlugs = indexableServiceSlugs(catalogue.items, presentations);
  const presentationTitle = new Map(presentations.map((row) => [row.slug, row.title]));
  const catalogueTitle = new Map(catalogue.items.map((row) => [row.slug, row.title]));
  const serviceLinks: SitemapLink[] = serviceSlugs.map((slug) => ({
    href: `/services/${slug}`,
    label: presentationTitle.get(slug) ?? catalogueTitle.get(slug) ?? titleFromSlug(slug),
  }));

  const articleLinks: SitemapLink[] = posts
    .filter((post) => post.seo.noIndex !== true)
    .map((post) => ({
      href: `/articles/${post.slug}`,
      label: post.title,
    }));

  const productLinks: SitemapLink[] = productSkus.map((sku) => {
    const entry = findCatalogEntry(sku);
    if (entry !== null) {
      const label = entry.kind === 'featured' ? entry.title : entry.product.title;
      return { href: productDetailPath(sku), label };
    }
    const label = catalogueProductTitle.get(sku) ?? sku.toUpperCase();
    return { href: productDetailPath(sku), label };
  });

  return dedupeLinks([
    ...staticLinks,
    ...pageLinks,
    ...policyLinks,
    ...serviceLinks,
    ...articleLinks,
    ...productLinks,
  ]);
}

function dedupeLinks(links: readonly SitemapLink[]): SitemapLink[] {
  const byHref = new Map<string, SitemapLink>();
  for (const link of links) {
    byHref.set(link.href, link);
  }
  return [...byHref.values()];
}

function staticLabel(href: string): string {
  const labels: Record<string, string> = {
    '/': 'Home',
    '/services': 'Research services',
    '/products': 'Physical products & reagents',
    '/articles': 'Research updates',
    '/about': 'About',
    '/contact': 'Contact',
    '/methodology': 'Methodology',
    '/data-retention': 'Data retention',
    '/privacy': 'Privacy',
    '/terms': 'Terms',
    '/faqs': 'FAQs',
    '/enquiry': 'Make an enquiry',
    '/sitemap': 'Sitemap',
  };
  return labels[href] ?? href;
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
