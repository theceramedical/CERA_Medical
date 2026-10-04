import { ArticleCard } from '@cera/ui/article-card';
import { Icon } from '@cera/ui/icon';
import { SectionHeader } from '@cera/ui/section-header';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import NextLink from 'next/link';

import type { ContentDocument } from '@cera/contracts';

import { AppButtonLink } from '../link.tsx';

const DEFAULT_COVERS = [
  '/images/article-cover-data.svg',
  '/images/article-cover-research.svg',
  '/images/article-cover-lab.svg',
] as const;

export interface ArticlesSectionProps {
  readonly heading?: string;
  readonly subheading?: string;
  readonly viewAllHref?: string;
  readonly viewAllLabel?: string;
  readonly maxPosts?: number;
  readonly posts?: readonly ContentDocument[];
}

/**
 * The three-article row (design-language.md section 5.4).
 */
export function ArticlesSection({
  heading = 'Research insights',
  subheading = 'Practical guidance on scoping laboratory work, omics analysis, and evidence reporting.',
  viewAllHref = '/articles',
  viewAllLabel = 'View All Articles',
  maxPosts = 3,
  posts,
}: ArticlesSectionProps) {
  const articles = (posts ?? []).slice(0, maxPosts).map((post, index) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    category: 'Article',
    coverSrc: DEFAULT_COVERS[index % DEFAULT_COVERS.length] ?? DEFAULT_COVERS[0],
  }));

  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="articles-heading" className="bg-surface">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-20">
        <SectionHeader
          level={2}
          heading={<span id="articles-heading">{heading}</span>}
          subheading={subheading}
          action={
            <AppButtonLink
              href={viewAllHref}
              variant="ghost"
              iconEnd={<Icon icon={ArrowRight} size="sm" />}
            >
              {viewAllLabel}
            </AppButtonLink>
          }
        />

        <ul className="mt-12 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.slug}
              title={article.title}
              excerpt={article.excerpt}
              category={article.category}
              href={`/articles/${article.slug}`}
              linkAs={NextLink}
              headingLevel={3}
              cover={
                /*
                 * `alt=""`, which makes the cover decorative - and that is deliberate rather than
                 * lazy. The card's title says what the article is about; an `alt` on the cover would
                 * describe a stock photograph, so a screen reader user would hear a description of an
                 * illustration followed by the real title. Section 5.4 makes the same call.
                 *
                 * 16:9 at 640x360 with explicit dimensions, so the card's height is settled before the
                 * image loads and the row does not reflow as three covers arrive at different times.
                 */
                <Image
                  src={article.coverSrc}
                  alt=""
                  width={640}
                  height={360}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-video h-auto w-full object-cover"
                />
              }
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
