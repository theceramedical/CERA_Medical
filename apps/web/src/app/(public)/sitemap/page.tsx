import { Heading } from '@cera/ui/typography';
import NextLink from 'next/link';

import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { MAIN_NAV, SUPPORT_NAV } from '../../../components/navigation.ts';
import { RichText } from '../../../components/rich-text.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';
import { listIndexableLinks } from '../../../lib/indexable-routes.ts';

import type { NavItem } from '../../../components/navigation.ts';
import type { SitemapLink } from '../../../lib/indexable-routes.ts';
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
  const indexable = await listIndexableLinks();

  const services = indexable.filter((link) => link.href.startsWith('/services/'));
  const articles = indexable.filter((link) => link.href.startsWith('/articles/'));
  const products = indexable.filter((link) => link.href.startsWith('/products/'));
  const cmsPages = indexable.filter(
    (link) =>
      link.href.startsWith('/') &&
      !link.href.startsWith('/services/') &&
      !link.href.startsWith('/articles/') &&
      !link.href.startsWith('/products/') &&
      !MAIN_NAV.some((item) => item.href === link.href) &&
      !SUPPORT_NAV.some((item) => item.href === link.href) &&
      !LEGAL_AND_OTHER.some((item) => item.href === link.href) &&
      link.href !== '/',
  );

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
        {services.length > 0 ? (
          <SitemapLinkGroup heading="Research services" links={services} />
        ) : null}
        {articles.length > 0 ? (
          <SitemapLinkGroup heading="Research updates" links={articles} />
        ) : null}
        {products.length > 0 ? (
          <SitemapLinkGroup heading="Physical products" links={products} />
        ) : null}
        {cmsPages.length > 0 ? (
          <SitemapLinkGroup heading="Other published pages" links={cmsPages} />
        ) : null}
      </div>
      {document.body ? (
        <div className="mx-auto max-w-site px-6 pb-16 md:px-10">
          <RichText body={document.body} />
        </div>
      ) : null}
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
            <SitemapAnchor href={item.href}>{item.label}</SitemapAnchor>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SitemapLinkGroup({
  heading,
  links,
}: {
  readonly heading: string;
  readonly links: readonly SitemapLink[];
}) {
  return (
    <section>
      <Heading level={2} size="h4">
        {heading}
      </Heading>
      <ul className="mt-4 flex list-none flex-col gap-2 p-0">
        {links.map((link) => (
          <li key={link.href}>
            <SitemapAnchor href={link.href}>{link.label}</SitemapAnchor>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SitemapAnchor({ href, children }: { readonly href: string; readonly children: string }) {
  return (
    <NextLink
      href={href}
      className="inline-flex min-h-8 items-center text-body text-primary underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      {children}
    </NextLink>
  );
}
