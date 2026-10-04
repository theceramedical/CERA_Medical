import { Heading, Text } from '@cera/ui/typography';
import NextLink from 'next/link';

import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { MAIN_NAV, SUPPORT_NAV } from '../../../components/navigation.ts';
import { RichText } from '../../../components/rich-text.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';

import type { NavItem } from '../../../components/navigation.ts';
import type { Metadata } from 'next';

const LEGAL_AND_OTHER: readonly NavItem[] = [
  { href: '/sitemap', label: 'Sitemap' },
  { href: '/search', label: 'Search' },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCurrentDocument('page', 'sitemap');
  return {
    title: page?.seo.title ?? 'Sitemap',
    description:
      page?.seo.description ?? page?.excerpt ?? 'Every page on the CERA Medical website.',
  };
}

export default async function SitemapPage() {
  const document = await getCurrentDocument('page', 'sitemap');
  if (document === null) return <CmsPageUnavailable slug="sitemap" />;

  const hero = sectionHeadingFromLayout(document.layout);

  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? document.title}
        lede={hero?.lede ?? document.excerpt ?? ''}
        eyebrow={hero?.eyebrow ?? 'Site map'}
      />
      <div className="mx-auto grid max-w-site grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 md:px-10 lg:grid-cols-3 lg:py-16">
        <SitemapGroup heading="Main pages" items={MAIN_NAV} />
        <SitemapGroup heading="Enquiries and support" items={SUPPORT_NAV} />
        <SitemapGroup heading="This site" items={LEGAL_AND_OTHER} />
      </div>
      {document.body ? (
        <div className="mx-auto max-w-site px-6 pb-16 md:px-10">
          <RichText body={document.body} />
        </div>
      ) : (
        <div className="mx-auto max-w-site px-6 pb-16 md:px-10">
          <Text size="caption" tone="muted" measure>
            Individual service pages are listed with the catalogue. Approved research updates will
            appear when CERA Medical publishes them.
          </Text>
        </div>
      )}
    </>
  );
}

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
