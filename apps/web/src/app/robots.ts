import { siteUrl } from '../lib/site-url.ts';

import type { MetadataRoute } from 'next';

/**
 * `robots.txt`.
 *
 * **This is a request, not a control.** A well-behaved crawler honours it; nothing else does, and a
 * `Disallow` line publishes the existence of the path it names. So the authenticated areas are excluded
 * here *and* protected by `proxy.ts` plus per-request authorisation in `apps/api` - the exclusion is
 * about crawl budget and about keeping a portal page out of a search result, never about access.
 *
 * The `Disallow` entries are prefixes that exist in the routing, so they cannot drift from the route
 * groups the way a hand-maintained list of individual URLs would.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Customer portal and staff console: nothing here is public, and an indexed portal page would
        // be a cached view of someone's data in a search result.
        '/account',
        '/staff',

        // Sign-in and the OIDC callback. Crawling either creates sessions nobody asked for and
        // generates authentication errors that look like an attack in the logs.
        '/auth',

        /**
         * Search results. Following links into these produces an unbounded set of thin,
         * near-duplicate URLs - one per query - competing with the real service and article pages for
         * the same terms.
         */
        '/search',
        '/cart',
        '/checkout',
        '/api',

        // The design preview, which is not served in production at all. Listed so that if the guard is
        // ever loosened, the route is still not crawled.
        '/dev',

        // Draft-preview enable/disable. A crawler hitting these with a stale
        // token just 401s, but the path should not be in an index anyway.
        '/api/preview',

        // Server-to-server cache invalidation. A crawler has no business here.
        '/api/revalidate',
      ],
    },

    /**
     * An absolute URL, which the specification requires for `Sitemap` - unlike every other line in the
     * file, a relative path here is simply ignored, and silently.
     *
     * Phase 07 generates the sitemap itself; this points at it now so the reference is in place and
     * tested rather than added as an afterthought once the file exists.
     */
    sitemap: new URL('/sitemap.xml', siteUrl()).toString(),
  };
}
