import {
  CATALOG_PRODUCTS,
  FEATURED_PRODUCT,
  productDetailPath,
} from '../content/products-catalog.ts';

import { FIXTURE_SERVICE_SLUGS } from './catalogue-fixtures.ts';
import { listPublishedDocuments } from './cms/client.ts';
import { listSitemapEntries } from './indexable-sitemap.ts';

export interface SitemapLink {
  readonly href: string;
  readonly label: string;
}

const STATIC_PATHS = [
  '/',
  '/services',
  '/products',
  '/articles',
  '/about',
  '/contact',
  '/methodology',
  '/data-retention',
  '/privacy',
  '/terms',
  '/faqs',
  '/enquiry',
  '/sitemap',
] as const;

function policyPath(slug: string): string {
  if (slug === 'privacy-policy' || slug === 'privacy') return '/privacy';
  if (slug === 'terms-of-service' || slug === 'terms') return '/terms';
  if (slug === 'data-retention-policy') return '/data-retention';
  return `/${slug}`;
}

/** Paths for `sitemap.xml` and the HTML sitemap page — published, indexable routes only. */
export async function listIndexablePaths(): Promise<readonly string[]> {
  const entries = await listSitemapEntries();
  return entries.map((entry) => entry.path).sort((a, b) => a.localeCompare(b));
}

export async function listIndexableLinks(): Promise<readonly SitemapLink[]> {
  const [posts, pages, presentations, policies] = await Promise.all([
    listPublishedDocuments('post').catch(() => []),
    listPublishedDocuments('page').catch(() => []),
    listPublishedDocuments('servicePresentation').catch(() => []),
    listPublishedDocuments('policy').catch(() => []),
  ]);

  const staticLinks: SitemapLink[] = STATIC_PATHS.map((href) => ({
    href,
    label: staticLabel(href),
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

  const serviceSlugs = [
    ...new Set([...FIXTURE_SERVICE_SLUGS, ...presentations.map((service) => service.slug)]),
  ];
  const presentationTitle = new Map(presentations.map((row) => [row.slug, row.title]));
  const presentationNoIndex = new Map(
    presentations.map((row) => [row.slug, row.seo.noIndex === true]),
  );
  const serviceLinks: SitemapLink[] = serviceSlugs
    .filter((slug) => presentationNoIndex.get(slug) !== true)
    .map((slug) => ({
      href: `/services/${slug}`,
      label: presentationTitle.get(slug) ?? titleFromSlug(slug),
    }));

  const articleLinks: SitemapLink[] = posts
    .filter((post) => post.seo.noIndex !== true)
    .map((post) => ({
      href: `/articles/${post.slug}`,
      label: post.title,
    }));

  const productRows = [
    { sku: FEATURED_PRODUCT.sku, title: FEATURED_PRODUCT.title },
    ...CATALOG_PRODUCTS.map((product) => ({ sku: product.sku, title: product.title })),
  ];
  const productLinks: SitemapLink[] = dedupeLinks(
    productRows.map((row) => ({
      href: productDetailPath(row.sku),
      label: row.title,
    })),
  );

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
