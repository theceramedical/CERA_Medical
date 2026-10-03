import { ArticleCard } from '@cera/ui/article-card';
import { EmptyState } from '@cera/ui/empty-state';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { listPublishedDocuments } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research Updates',
    description: 'Research updates published by CERA Medical.',
    path: '/articles',
  });
}

export default async function ArticlesPage() {
  const published = await listPublishedDocuments('post');
  const items = published.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    category: 'Article',
  }));

  return (
    <>
      <PageHeader
        title="Research Updates"
        lede="Project news and research articles approved for publication by CERA Medical."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {items.length === 0 ? (
          <EmptyState
            heading="No articles yet"
            headingLevel={2}
            description="No research updates have been published yet."
            action={<AppLink href="/">Back to the homepage</AppLink>}
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
