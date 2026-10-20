import type { ContentDocument } from '@cera/contracts';

import { HOMEPAGE_ARTICLES } from './homepage.ts';

const STAMP = '2026-10-15T00:00:00.000Z';

function localArticleDocument(article: (typeof HOMEPAGE_ARTICLES)[number]): ContentDocument {
  return {
    id: `local-${article.slug}`,
    type: 'post',
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    body: {},
    seo: {
      title: article.title.slice(0, 70),
      description: article.excerpt.slice(0, 180),
      canonicalUrl: null,
      ogImageId: null,
      noIndex: false,
    },
    mediaIds: [],
    status: 'published',
    authorId: null,
    approverId: null,
    publishedAt: STAMP,
    createdAt: STAMP,
    updatedAt: STAMP,
  };
}

/** CMS posts first, then laboratory research notes that are not in the CMS yet. */
export function withLocalArticles(posts: readonly ContentDocument[]): readonly ContentDocument[] {
  const known = new Set(posts.map((post) => post.slug));
  const extra = HOMEPAGE_ARTICLES.filter((article) => !known.has(article.slug)).map(
    localArticleDocument,
  );
  return [...posts, ...extra];
}

export function localArticleBySlug(slug: string): ContentDocument | null {
  const article = HOMEPAGE_ARTICLES.find((item) => item.slug === slug);
  return article === undefined ? null : localArticleDocument(article);
}
