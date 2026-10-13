import { CmsContentPage } from '../../../components/cms-content-page.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const document = await getCurrentDocument('page', 'about');
  return pageMetadata({
    title: document?.seo.title ?? document?.title ?? 'About CERA Medical',
    description: document?.seo.description ?? document?.excerpt ?? '',
    path: '/about',
    noIndex: document?.seo.noIndex ?? false,
  });
}

export default async function AboutPage() {
  const document = await getCurrentDocument('page', 'about');
  if (document === null) return <CmsPageUnavailable slug="about" />;
  return <CmsContentPage document={document} />;
}
