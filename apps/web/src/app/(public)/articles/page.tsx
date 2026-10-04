import { ArticlesIndex } from '../../../components/articles/articles-index.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
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
  if (page === null) return <CmsPageUnavailable slug="articles" />;

  return (
    <ArticlesIndex
      posts={published}
      {...(params.q === undefined ? {} : { query: params.q })}
      {...(params.topic === undefined ? {} : { topic: params.topic })}
    />
  );
}
