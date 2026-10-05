import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

import type { ContentDocument } from '@cera/contracts';

import { HOMEPAGE_ARTICLES } from '../../content/homepage.ts';
import { AppLink } from '../link.tsx';

export interface ArticlesSectionProps {
  readonly heading?: string;
  readonly subheading?: string;
  readonly viewAllHref?: string;
  readonly viewAllLabel?: string;
  readonly maxPosts?: number;
  readonly posts?: readonly ContentDocument[];
}

export function ArticlesSection({
  heading = 'Health Insights & Articles',
  subheading = 'Practical guidance on scoping laboratory work, omics analysis, and evidence reporting.',
  viewAllHref = '/articles',
  viewAllLabel = 'View All Articles',
  maxPosts = 3,
  posts,
}: ArticlesSectionProps) {
  const fromCms = (posts ?? []).slice(0, maxPosts).map((post, index) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    category: HOMEPAGE_ARTICLES[index]?.category ?? 'Article',
    coverSrc: HOMEPAGE_ARTICLES[index]?.coverSrc ?? '/images/article-cover-data.svg',
  }));
  const articles = fromCms.length > 0 ? fromCms : HOMEPAGE_ARTICLES.slice(0, maxPosts);

  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="articles-heading" className="border-b border-border bg-surface py-16">
      <div className="mx-auto max-w-site px-6 md:px-10">
        <div className="mb-12 flex flex-col justify-between md:flex-row md:items-end">
          <div>
            <Text
              as="p"
              size="eyebrow"
              className="font-semibold tracking-widest text-accent uppercase"
            >
              Technical white papers
            </Text>
            <Heading level={2} size="h2" id="articles-heading" className="mt-1 mb-2">
              {heading}
            </Heading>
            <Text tone="muted">{subheading}</Text>
          </div>
          <AppLink
            href={viewAllHref}
            className="mt-4 inline-flex items-center gap-1.5 font-semibold text-accent no-underline md:mt-0"
          >
            {viewAllLabel}
            <Icon icon={ArrowRight} size="sm" />
          </AppLink>
        </div>
        <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {articles.map((article) => (
            <li
              key={article.slug}
              className="flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-surface shadow-card"
            >
              <div>
                <div className="pointer-events-none relative aspect-video w-full overflow-hidden bg-surface-tint">
                  <Image
                    src={article.coverSrc}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <span className="absolute top-3 left-3 rounded-sm bg-accent px-2.5 py-1 text-[11px] font-bold text-on-accent">
                    {article.category}
                  </span>
                </div>
                <div className="p-6">
                  <Heading level={3} size="h4" className="mb-2">
                    {article.title}
                  </Heading>
                  <Text size="body-sm" tone="muted" className="line-clamp-3">
                    {article.excerpt}
                  </Text>
                </div>
              </div>
              <div className="px-6 pt-0 pb-6">
                <AppLink
                  href={`/articles/${article.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold tracking-wider text-primary uppercase no-underline"
                >
                  Read More
                  <Icon icon={ArrowRight} size="sm" />
                </AppLink>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
