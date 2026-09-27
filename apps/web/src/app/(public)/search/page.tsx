import { EmptyState } from '@cera/ui/empty-state';
import { Text } from '@cera/ui/typography';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { HOMEPAGE_ARTICLES, HOMEPAGE_SERVICES } from '../../../content/homepage.ts';
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

function rank(query: string): Hit[] {
  const term = query.toLowerCase();
  const services = HOMEPAGE_SERVICES.filter(
    (item) => item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term),
  ).map((item) => ({
    href: `/services/${item.slug}`,
    title: item.title,
    excerpt: item.description,
  }));
  const articles = HOMEPAGE_ARTICLES.filter(
    (item) => item.title.toLowerCase().includes(term) || item.excerpt.toLowerCase().includes(term),
  ).map((item) => ({
    href: `/articles/${item.slug}`,
    title: item.title,
    excerpt: item.excerpt,
  }));
  return [...services, ...articles].sort((a, b) => a.href.localeCompare(b.href));
}

export default async function SearchPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const hits = query.length >= 2 ? rank(query) : [];

  return (
    <>
      <PageHeader title="Search" lede="Find a service or an article." />
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
