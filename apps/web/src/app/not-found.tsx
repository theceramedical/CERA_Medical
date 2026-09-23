import { SkipLink } from '@cera/ui/skip-link';

import { SiteFooter } from '../components/site-footer.tsx';
import { SiteHeader } from '../components/site-header.tsx';

import PublicNotFound from './(public)/not-found.tsx';

import type { Metadata } from 'next';

/**
 * The root 404, for a URL that matches no route group at all.
 *
 * Next requires this file to exist for unmatched URLs; a route group's `not-found.tsx` only covers
 * paths inside that group. Without it the response is Next's own unstyled default page, which is the
 * one page on the site that would look like a different site.
 *
 * It renders the public 404 inside a hand-assembled copy of the public shell rather than reusing
 * `(public)/layout.tsx`, because a root-level `not-found` sits *outside* every route group and so
 * receives none of their layouts. The duplication is three elements and is the alternative to a
 * visitor with a mistyped URL getting a bare panel on a white page.
 */

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink targetId="main" />
      <SiteHeader />

      <main id="main" tabIndex={-1} className="flex-1 focus-visible:outline-none">
        <PublicNotFound />
      </main>

      <SiteFooter />
    </div>
  );
}
