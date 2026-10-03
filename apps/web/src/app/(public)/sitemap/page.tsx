import { Heading, Text } from '@cera/ui/typography';
import NextLink from 'next/link';

import { MAIN_NAV, SUPPORT_NAV } from '../../../components/navigation.ts';
import { PageHeader } from '../../../components/page-header.tsx';

import type { NavItem } from '../../../components/navigation.ts';
import type { Metadata } from 'next';

/**
 * The human-readable sitemap.
 *
 * Distinct from `sitemap.xml`, which is for crawlers and is generated in Phase 07. This one is for
 * people: it is what someone reaches for when the navigation has not surfaced what they want, and it
 * is the single page that shows the whole site at once. It is also the most reliable way for a screen
 * reader user to get an overview of a site's structure, which is why it renders as nested lists with
 * real headings rather than as a grid of cards.
 *
 * Built from the same arrays as the header and footer, so a route that is renamed or added appears here
 * without anyone remembering to update it - which is the failure this page is most prone to, since it
 * is the one page nobody visits while developing.
 */

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'Every page on the CERA Medical website, in one list.',
};

/** Pages that are neither main navigation nor support links, so would otherwise be unreachable here. */
const LEGAL_AND_OTHER: readonly NavItem[] = [
  { href: '/sitemap', label: 'Sitemap' },
  { href: '/search', label: 'Search' },
];

export default function SitemapPage() {
  return (
    <>
      <PageHeader
        title="Sitemap"
        lede="Every page on this site, in one list. If the navigation has not turned up what you need, it is here."
      />

      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 md:px-10 lg:grid-cols-3 lg:py-16">
        <SitemapGroup heading="Main pages" items={MAIN_NAV} />
        <SitemapGroup heading="Enquiries and support" items={SUPPORT_NAV} />
        <SitemapGroup heading="This site" items={LEGAL_AND_OTHER} />
      </div>

      <div className="mx-auto max-w-site px-6 pb-16 md:px-10">
        <Text size="caption" tone="muted" measure>
          Individual service pages are listed with the catalogue. Approved research updates will
          appear when CERA Medical publishes them.
        </Text>
      </div>
    </>
  );
}

/**
 * One group, as a heading and a list.
 *
 * Not wrapped in `<nav>`. A page whose entire purpose is navigation does not need its landmarks
 * subdivided - three more navigation landmarks here would dilute the landmark list rather than help
 * anyone, and the headings already provide the structure to jump between.
 */
function SitemapGroup({
  heading,
  items,
}: {
  readonly heading: string;
  readonly items: readonly NavItem[];
}) {
  return (
    <section>
      <Heading level={2} size="h4">
        {heading}
      </Heading>

      <ul className="mt-4 flex list-none flex-col gap-2 p-0">
        {items.map((item) => (
          <li key={item.href}>
            <NextLink
              href={item.href}
              className="inline-flex min-h-8 items-center text-body text-primary underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {item.label}
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
