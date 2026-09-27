import { ArticleCard } from '@cera/ui/article-card';
import { EmptyState } from '@cera/ui/empty-state';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { HOMEPAGE_ARTICLES } from '../../../content/homepage.ts';
import { listPublishedDocuments } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Health Insights & Articles',
    description: 'Helpful information to support your health and wellbeing.',
    path: '/articles',
  });
}

export default async function ArticlesPage() {
  const published = await listPublishedDocuments('post');
  const items =
    published.length > 0
      ? published.map((post) => ({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? '',
          category: 'Article',
        }))
      : HOMEPAGE_ARTICLES;

  return (
    <>
      <PageHeader
        title="Health Insights & Articles"
        lede="Helpful information to support your health and wellbeing."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {items.length === 0 ? (
          <EmptyState
            heading="No articles yet"
            description="Published articles will appear here once they have been approved."
            action={<AppLink href="/">Back to the homepage</AppLink>}
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
