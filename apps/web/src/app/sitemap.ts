import { HOMEPAGE_ARTICLES, HOMEPAGE_SERVICES } from '../content/homepage.ts';
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

  const staticRoutes = ['/', '/services', '/articles', '/about', '/contact', '/privacy', '/terms', '/faqs', '/enquiry', '/sitemap'];

  const posts = await listPublishedDocuments('post').catch(() => []);
  const articleRoutes =
    posts.length > 0 ? posts.map((post) => `/articles/${post.slug}`) : HOMEPAGE_ARTICLES.map((article) => `/articles/${article.slug}`);

  const serviceRoutes = HOMEPAGE_SERVICES.map((service) => `/services/${service.slug}`);

  return [...staticRoutes, ...serviceRoutes, ...articleRoutes].map((path) => ({
    url: new URL(path, origin).toString(),
    lastModified: now,
  }));
}
