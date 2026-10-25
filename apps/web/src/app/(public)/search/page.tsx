import { EmptyState } from '@cera/ui/empty-state';
import { Text } from '@cera/ui/typography';

import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { AppLink } from '../../../components/link.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { listPublicServices } from '../../../lib/catalogue/client.ts';
import { getCurrentDocument, listPublishedDocuments } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Search',
    description: 'Search CERA Medical services and articles.',
    path: '/search',
    noIndex: true,
  });
}

interface Hit {
  readonly href: string;
  readonly title: string;
  readonly excerpt: string;
}

export default async function SearchPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  const [page, { items: services }, posts] = await Promise.all([
    getCurrentDocument('page', 'search'),
    listPublicServices(),
    listPublishedDocuments('post'),
  ]);
  if (page === null) return <CmsPageUnavailable slug="search" />;

  const hero = sectionHeadingFromLayout(page.layout);
  const presentations = await listPublishedDocuments('servicePresentation');
  const presentationBySlug = new Map(presentations.map((item) => [item.slug, item]));

  const hits: Hit[] =
    query.length >= 2
      ? [
          ...services
            .filter((item) => {
              const copy = presentationBySlug.get(item.slug);
              const text = `${item.title} ${copy?.excerpt ?? item.summary}`.toLowerCase();
              return text.includes(query.toLowerCase());
            })
            .map((item) => ({
              href: `/services/${item.slug}`,
              title: presentationBySlug.get(item.slug)?.title ?? item.title,
              excerpt: presentationBySlug.get(item.slug)?.excerpt ?? item.summary,
            })),
          ...posts
            .filter((item) => {
              const text = `${item.title} ${item.excerpt ?? ''}`.toLowerCase();
              return text.includes(query.toLowerCase());
            })
            .map((item) => ({
              href: `/articles/${item.slug}`,
              title: item.title,
              excerpt: item.excerpt ?? '',
            })),
        ].sort((a, b) => a.href.localeCompare(b.href))
      : [];

  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? page.title}
        lede={hero?.lede ?? page.excerpt ?? ''}
        eyebrow={hero?.eyebrow ?? 'Site search'}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <form method="get" className="mb-8 flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 flex-col gap-2">
            <Text size="caption">Search</Text>
            <input
              name="q"
              defaultValue={query}
              minLength={2}
              maxLength={120}
              className="rounded-md border border-border bg-surface px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-md bg-primary-700 px-4 py-2 text-on-primary">
            Search
          </button>
        </form>

        <p className="sr-only" aria-live="polite">
          {query.length < 2 ? 'Enter at least two characters.' : `${String(hits.length)} results`}
        </p>

        {query.length >= 2 && hits.length === 0 ? (
          <EmptyState
            heading="No results"
            description="Try a different term, or browse services and articles from the menu."
            action={<AppLink href="/services">Browse services</AppLink>}
          />
        ) : null}

        {hits.length > 0 ? (
          <ul className="space-y-4">
            {hits.map((hit) => (
              <li key={hit.href}>
                <AppLink href={hit.href}>{hit.title}</AppLink>
                <Text tone="muted">{hit.excerpt}</Text>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
