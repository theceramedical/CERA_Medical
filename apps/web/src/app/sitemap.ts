import { HOMEPAGE_SERVICES } from '../content/homepage.ts';
import { listPublishedDocuments } from '../lib/cms/client.ts';
import { siteUrl } from '../lib/site-url.ts';

import type { MetadataRoute } from 'next';

/**
 * Indexable routes only. Search, preview, account, staff, and /dev stay out.
 * Drafts never appear because listPublishedDocuments filters them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const now = new Date();

  const staticRoutes = [
    '/',
    '/services',
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
  ];

  const [posts, pages, presentations, policies] = await Promise.all([
    listPublishedDocuments('post').catch(() => []),
    listPublishedDocuments('page').catch(() => []),
    listPublishedDocuments('servicePresentation').catch(() => []),
    listPublishedDocuments('policy').catch(() => []),
  ]);
  const articleRoutes = posts.map((post) => `/articles/${post.slug}`);
  const pageRoutes = pages.filter((page) => page.slug !== 'home').map((page) => `/${page.slug}`);
  const policyRoutes = policies.map((policy) => {
    if (policy.slug === 'privacy-policy' || policy.slug === 'privacy') return '/privacy';
    if (policy.slug === 'terms-of-service' || policy.slug === 'terms') return '/terms';
    if (policy.slug === 'data-retention-policy') return '/data-retention';
    return `/${policy.slug}`;
  });
  const serviceRoutes = [
    ...new Set([
      ...HOMEPAGE_SERVICES.map((service) => service.slug),
      ...presentations.map((service) => service.slug),
    ]),
  ].map((slug) => `/services/${slug}`);

  return [
    ...new Set([
      ...staticRoutes,
      ...pageRoutes,
      ...policyRoutes,
      ...serviceRoutes,
      ...articleRoutes,
    ]),
  ].map((path) => ({
    url: new URL(path, origin).toString(),
    lastModified: now,
  }));
}
