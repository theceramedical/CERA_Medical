import { ArticleCard } from '@cera/ui/article-card';
import { EmptyState } from '@cera/ui/empty-state';

import { AppLink } from '../../../../../components/link.tsx';
import { MarketingPageHeader } from '../../../../../components/marketing-page-header.tsx';
import { listPublishedDocuments } from '../../../../../lib/cms/client.ts';
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
    description: 'Published articles in this category.',
    path: `/articles/category/${slug}`,
    noIndex: true,
  });
}

export default async function ArticlesCategoryPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const published = await listPublishedDocuments('post');
  const items = published
    .filter((post) => post.slug.includes(slug) || slug === 'all')
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? '',
      category: 'Article',
    }));

  return (
    <>
      <MarketingPageHeader
        title={`Articles: ${slug}`}
        lede="Published articles in this category."
        eyebrow="Research updates"
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {items.length === 0 ? (
          <EmptyState
            heading="No articles in this category"
            description="Browse all research updates or publish posts in Payload CMS."
            action={<AppLink href="/articles">All articles</AppLink>}
          />
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => (
              <ArticleCard
                headingLevel={2}
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
