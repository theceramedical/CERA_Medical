import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { CmsContentPage } from '../../../components/cms-content-page.tsx';
import { getDocument } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const document = await getDocument('page', slug, false);
  if (document === null) return {};
  return pageMetadata({
    title: document.seo.title ?? document.title,
    description: document.seo.description ?? document.excerpt ?? '',
    path: `/${slug}`,
    noIndex: document.seo.noIndex,
  });
}

export default async function CmsSlugPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const draft = await draftMode();
  const document = await getDocument('page', slug, draft.isEnabled);
  if (document?.status !== 'published') notFound();
  return <CmsContentPage document={document} />;
}
