import { ArticlesIndex } from '../../../components/articles/articles-index.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { withLocalArticles } from '../../../content/local-articles.ts';
import { getCurrentDocument, listPublishedDocuments } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research Updates',
    description: 'Research updates published by CERA Medical.',
    path: '/articles',
  });
}

export default async function ArticlesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ q?: string; topic?: string }>;
}) {
  const params = await searchParams;
  const [published, page] = await Promise.all([
    listPublishedDocuments('post'),
    getCurrentDocument('page', 'articles'),
  ]);
  const posts = withLocalArticles(published);
  if (page === null && posts.length === 0) return <CmsPageUnavailable slug="articles" />;

  return (
    <ArticlesIndex
      posts={posts}
      {...(params.q === undefined ? {} : { query: params.q })}
      {...(params.topic === undefined ? {} : { topic: params.topic })}
    />
  );
}
