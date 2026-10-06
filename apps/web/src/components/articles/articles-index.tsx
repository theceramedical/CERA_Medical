import { ArticleCard } from '@cera/ui/article-card';
import { EmptyState } from '@cera/ui/empty-state';
import { Heading, Text } from '@cera/ui/typography';

import type { ContentDocument } from '@cera/contracts';

import { postCoverAlt, postCoverSrc } from '../../lib/cms/post-cover.ts';
import { AppButtonLink, AppLink } from '../link.tsx';

import { ArticleCoverImage } from './article-cover-image.tsx';

export const ARTICLE_TOPICS: readonly { id: string; label: string }[] = [
  { id: 'all', label: 'All Updates' },
  { id: 'methods', label: 'Research Methods' },
  { id: 'data', label: 'Data Analysis' },
  { id: 'laboratory', label: 'Laboratory' },
  { id: 'evidence', label: 'Evidence Synthesis' },
  { id: 'governance', label: 'Quality & Governance' },
];

function topicFor(post: ContentDocument): string {
  const hay = `${post.slug} ${post.title} ${post.excerpt ?? ''}`.toLowerCase();
  if (hay.includes('metagenom') || hay.includes('method') || hay.includes('planning'))
    return 'methods';
  if (hay.includes('omics') || hay.includes('batch') || hay.includes('qc')) return 'data';
  if (hay.includes('preclinical') || hay.includes('lab') || hay.includes('sample'))
    return 'laboratory';
  if (hay.includes('prisma') || hay.includes('evidence') || hay.includes('review'))
    return 'evidence';
  if (hay.includes('govern') || hay.includes('ethic') || hay.includes('quality'))
    return 'governance';
  return 'methods';
}

export function ArticlesIndex({
  posts,
  query,
  topic,
}: {
  readonly posts: readonly ContentDocument[];
  readonly query?: string;
  readonly topic?: string;
}) {
  const q = query?.trim().toLowerCase() ?? '';
  const active = topic ?? 'all';
  const filtered = posts.filter((post) => {
    if (active !== 'all' && topicFor(post) !== active) return false;
    if (q.length === 0) return true;
    return `${post.title} ${post.excerpt ?? ''} ${post.slug}`.toLowerCase().includes(q);
  });
  const featured = filtered[0];
  const rest = featured === undefined ? [] : filtered.slice(1);

  return (
    <>
      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-2 text-caption text-muted"
          >
            <AppLink href="/">Home</AppLink>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-heading">Research Updates</span>
          </nav>
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-sm bg-primary-50 px-2.5 py-0.5 text-caption tracking-wider text-primary uppercase">
            Biomedical Insights & Methodological Notes
          </p>
          <Heading level={1} size="h1" className="mb-4">
            Research Updates
          </Heading>
          <Text size="body-lg" tone="muted" className="mb-8 max-w-3xl">
            Project news and research articles approved for publication by CERA Medical. Practical
            guidance on scoping laboratory work, omics analysis, and evidence reporting for research
            teams and partner institutions.
          </Text>
          <form
            method="get"
            className="mb-6 rounded-lg border border-border bg-surface p-4 shadow-card"
          >
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <span className="sr-only">Search articles</span>
                <input
                  name="q"
                  defaultValue={query ?? ''}
                  placeholder="Search articles, methods, or protocols..."
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3"
                />
              </label>
              {active !== 'all' ? <input type="hidden" name="topic" value={active} /> : null}
              <button
                type="submit"
                className="h-10 rounded-lg bg-primary-700 px-4 text-caption font-semibold text-on-primary"
              >
                Search
              </button>
            </div>
            <nav
              className="mt-4 flex items-center gap-2 overflow-x-auto"
              aria-label="Article topics"
            >
              {ARTICLE_TOPICS.map((tab) => {
                const selected = tab.id === active;
                const href =
                  tab.id === 'all'
                    ? '/articles'
                    : `/articles?topic=${tab.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
                return (
                  <AppLink
                    key={tab.id}
                    href={href}
                    aria-current={selected ? 'page' : undefined}
                    className={
                      selected
                        ? 'whitespace-nowrap rounded-full bg-accent-fill px-3.5 py-1.5 text-caption font-semibold text-on-accent no-underline'
                        : 'whitespace-nowrap rounded-full bg-surface-tint px-3.5 py-1.5 text-caption text-muted no-underline'
                    }
                  >
                    {tab.label}
                  </AppLink>
                );
              })}
            </nav>
          </form>
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface px-4 py-3 text-caption text-muted md:grid-cols-4">
            <span>
              <strong className="text-heading">{posts.length}</strong> Published Articles
            </span>
            <span>
              <strong className="text-heading">5</strong> Core Disciplines
            </span>
            <span>Peer-Reviewed Standards</span>
            <span>Updated Weekly</span>
          </div>
        </div>
      </section>

      {featured ? (
        <section className="mx-auto max-w-site px-6 py-12 md:px-10">
          <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="relative aspect-video overflow-hidden bg-surface-tint lg:col-span-6 lg:aspect-auto">
                <ArticleCoverImage
                  src={postCoverSrc(featured, featured.slug)}
                  alt={postCoverAlt(featured)}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
                <div className="absolute top-4 left-4 rounded-sm bg-accent px-3 py-1 text-caption font-semibold tracking-wider text-on-accent uppercase">
                  Flagship Technical Note
                </div>
              </div>
              <div className="flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:col-span-6">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2.5 text-caption text-muted">
                    <span className="rounded-sm bg-primary-50 px-2.5 py-0.5 font-semibold text-primary uppercase">
                      {ARTICLE_TOPICS.find((tab) => tab.id === topicFor(featured))?.label ??
                        'Research Methods'}
                    </span>
                  </div>
                  <Heading level={2} size="h3" className="mb-4">
                    <AppLink href={`/articles/${featured.slug}`}>{featured.title}</AppLink>
                  </Heading>
                  <Text tone="muted" className="mb-6">
                    {featured.excerpt}
                  </Text>
                </div>
                <AppButtonLink href={`/articles/${featured.slug}`} variant="primary">
                  Read Full Article
                </AppButtonLink>
              </div>
            </div>
          </article>
        </section>
      ) : (
        <div className="mx-auto max-w-site px-6 py-12 md:px-10">
          <EmptyState
            heading="No articles yet"
            headingLevel={2}
            description="No research updates have been published yet."
            action={<AppLink href="/">Back to the homepage</AppLink>}
          />
        </div>
      )}

      {rest.length > 0 ? (
        <section className="border-y border-border bg-surface py-12 md:py-16">
          <div className="mx-auto max-w-site px-6 md:px-10">
            <div className="mb-10 flex flex-col justify-between border-b border-border pb-4 md:flex-row md:items-end">
              <div>
                <Heading level={2} size="h3">
                  Published Technical Guides & Protocols
                </Heading>
                <Text tone="muted" className="mt-1">
                  Methodological transparency and peer-validated computational workflows from CERA
                  study directors.
                </Text>
              </div>
              <Text size="caption" className="mt-4 text-accent-fill md:mt-0">
                Showing {rest.length} of {filtered.length} Articles
              </Text>
            </div>
            <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <ArticleCard
                  key={post.slug}
                  headingLevel={3}
                  title={post.title}
                  excerpt={post.excerpt ?? ''}
                  href={`/articles/${post.slug}`}
                  category={
                    ARTICLE_TOPICS.find((tab) => tab.id === topicFor(post))?.label ?? 'Article'
                  }
                  linkAs={AppLink}
                  cover={
                    <ArticleCoverImage
                      src={postCoverSrc(post, post.slug)}
                      alt={postCoverAlt(post)}
                      width={640}
                      height={360}
                      className="aspect-video h-auto w-full object-cover"
                    />
                  }
                />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
