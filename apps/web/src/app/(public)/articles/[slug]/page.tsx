import { ArticleCard } from '@cera/ui/article-card';
import { Heading } from '@cera/ui/typography';
import { draftMode } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { ArticleDetailBody } from '../../../../components/articles/article-detail-body.tsx';
import { articleJsonLd, JsonLd } from '../../../../components/json-ld.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { MarketingPageHeader } from '../../../../components/marketing-page-header.tsx';
import { HOMEPAGE_ARTICLES } from '../../../../content/homepage.ts';
import { getDocument, listPublishedDocuments } from '../../../../lib/cms/client.ts';
import { absoluteUrl, pageMetadata } from '../../../../lib/seo.ts';
import { siteUrl } from '../../../../lib/site-url.ts';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const draft = await draftMode();
  const document = await getDocument('post', slug, draft.isEnabled);
  const title = document?.title;
  if (title === undefined) {
    return pageMetadata({
      title: 'Article not found',
      description: 'That article could not be found.',
      path: `/articles/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title,
    description: document?.excerpt ?? title,
    path: `/articles/${slug}`,
    noIndex: document?.seo.noIndex === true,
  });
}

function coverForSlug(slug: string): string {
  return (
    HOMEPAGE_ARTICLES.find((item) => item.slug === slug)?.coverSrc ??
    '/images/article-cover-data.svg'
  );
}

export default async function ArticleDetailPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const draft = await draftMode();
  const document = await getDocument('post', slug, draft.isEnabled);
  if (document === null) notFound();
  if (document.status !== 'published' && !draft.isEnabled) notFound();

  const title = document.title;
  const excerpt = document.excerpt ?? '';
  const related = (await listPublishedDocuments('post'))
    .filter((post) => post.slug !== slug)
    .slice(0, 3);

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          origin: siteUrl().origin,
          title,
          url: absoluteUrl(`/articles/${slug}`),
        })}
      />
      <MarketingPageHeader title={title} lede={excerpt} eyebrow="Research update" />
      <div className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 pb-8 md:px-10">
          <div className="relative aspect-[21/9] max-h-72 overflow-hidden rounded-lg border border-border shadow-card">
            <Image
              src={coverForSlug(slug)}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
            />
          </div>
        </div>
      </div>
      <ArticleDetailBody slug={slug} title={title} excerpt={excerpt} body={document.body} />

      {related.length > 0 ? (
        <section
          aria-labelledby="related-articles"
          className="border-t border-border bg-surface-tint py-14 md:py-16"
        >
          <div className="mx-auto max-w-site px-6 md:px-10">
            <Heading level={2} id="related-articles" size="h3" className="mb-8">
              More research updates
            </Heading>
            <ul className="grid list-none gap-6 p-0 md:grid-cols-3">
              {related.map((post) => (
                <li key={post.slug}>
                  <ArticleCard
                    href={`/articles/${post.slug}`}
                    title={post.title}
                    excerpt={post.excerpt ?? ''}
                    linkAs={AppLink}
                    category={
                      HOMEPAGE_ARTICLES.find((item) => item.slug === post.slug)?.category ??
                      'Article'
                    }
                    cover={
                      <Image
                        src={coverForSlug(post.slug)}
                        alt=""
                        width={640}
                        height={360}
                        className="aspect-video h-auto w-full object-cover"
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
