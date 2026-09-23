import { ComingSoon } from '../../../components/coming-soon.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search CERA Medical services and articles.',
  /**
   * A search results page should not be indexed.
   *
   * Crawlers following links into it generate an unbounded set of thin, near-duplicate URLs - one per
   * query - which competes with the real service and article pages for the same terms. Declared now
   * rather than in Phase 07, because by then the page will exist and the omission would already have
   * been crawled.
   */
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <ComingSoon
      title="Search"
      lede="Find a service or an article."
      plan="Phase 07 builds search across services and articles, with the results page keeping its query in the URL so a result list can be shared and returned to."
    />
  );
}
