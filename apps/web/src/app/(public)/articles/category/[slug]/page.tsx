import { ArticleCard } from '@cera/ui/article-card';
import { EmptyState } from '@cera/ui/empty-state';

import { AppLink } from '../../../../../components/link.tsx';
import { PageHeader } from '../../../../../components/page-header.tsx';
import { HOMEPAGE_ARTICLES } from '../../../../../content/homepage.ts';
import { pageMetadata } from '../../../../../lib/seo.ts';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return pageMetadata({
    title: `Articles: ${slug}`,
    description: `Articles in the ${slug} category.`,
    path: `/articles/category/${slug}`,
  });
}

export default async function ArticleCategoryPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const items = HOMEPAGE_ARTICLES.filter(
    (article) => article.category.toLowerCase().replace(/\s+/g, '-') === slug,
  );

  return (
    <>
      <PageHeader title={`Articles: ${slug}`} lede="Published articles in this category." />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {items.length === 0 ? (
          <EmptyState
            heading="No articles in this category"
            description="Try another category or browse the full list."
            action={<AppLink href="/articles">View all articles</AppLink>}
          />
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => (
              <ArticleCard
                key={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                href={`/articles/${post.slug}`}
                category={post.category}
                linkAs={AppLink}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
