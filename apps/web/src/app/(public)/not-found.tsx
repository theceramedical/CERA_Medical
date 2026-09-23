import { Icon } from '@cera/ui/icon';
import { FileQuestion } from 'lucide-react';

import { AppButtonLink } from '../../components/link.tsx';
import { RouteState } from '../../components/route-states.tsx';

import type { Metadata } from 'next';

/**
 * The public 404.
 *
 * Inside the route group rather than at the app root, so it renders with the site header and footer -
 * which is most of the value. A 404 that arrives as a bare panel with no navigation strands the user;
 * one inside the shell gives them the whole site to continue with, and the header's search link is
 * usually the fastest way to whatever they were looking for.
 *
 * `app/not-found.tsx` at the root still exists, for URLs that match no route group at all.
 */

export const metadata: Metadata = {
  title: 'Page not found',
  // A 404 should never be indexed. Next already returns a 404 status, which most crawlers honour, but
  // stating it costs one line and removes the dependence on that.
  robots: { index: false, follow: false },
};

export default function PublicNotFound() {
  return (
    <RouteState
      icon={<Icon icon={FileQuestion} size="lg" />}
      title="We could not find that page"
      description="The link may be out of date, or the address may have a typo in it. Our services and articles are both a click away."
      action={
        <>
          <AppButtonLink href="/" variant="primary">
            Go to the homepage
          </AppButtonLink>
          <AppButtonLink href="/services" variant="outline">
            Browse services
          </AppButtonLink>
        </>
      }
    />
  );
}
