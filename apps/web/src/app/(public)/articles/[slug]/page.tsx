import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { articleJsonLd, JsonLd } from '../../../../components/json-ld.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { RichText } from '../../../../components/rich-text.tsx';
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
      <PageHeader title={title} lede={excerpt} />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <RichText body={document.body} />

        {related.length > 0 ? (
          <nav aria-label="Related articles" className="mt-16">
            <ul className="space-y-2">
              {related.map((post) => (
                <li key={post.slug}>
                  <AppLink href={`/articles/${post.slug}`}>{post.title}</AppLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </>
  );
}
