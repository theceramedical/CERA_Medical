import type { ContentDocument } from '@cera/contracts';

import { HOMEPAGE_ARTICLES } from '../../content/homepage.ts';

function normalizeSrc(url: string): string {
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}

/** Cover image for a post: Payload `cover`, else SEO og image, else marketing fallback. */
export function postCoverSrc(post: ContentDocument, slug: string): string {
  if (post.coverImageUrl !== undefined && post.coverImageUrl !== null) {
    return normalizeSrc(post.coverImageUrl);
  }
  if (post.seo.ogImageUrl !== undefined && post.seo.ogImageUrl !== null) {
    return normalizeSrc(post.seo.ogImageUrl);
  }
  return (
    HOMEPAGE_ARTICLES.find((item) => item.slug === slug)?.coverSrc ??
    '/images/article-cover-data.svg'
  );
}

export function postCoverAlt(post: ContentDocument): string {
  if (post.coverImageAlt !== undefined && post.coverImageAlt !== null) {
    return post.coverImageAlt;
  }
  return '';
}
