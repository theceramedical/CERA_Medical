import type { ContentDocument } from '@cera/contracts';

import { AboutProfile } from '../../../components/about/about-profile.tsx';
import { CmsContentPage } from '../../../components/cms-content-page.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

function isPlaceholderAbout(document: ContentDocument): boolean {
  const haystack = `${document.title} ${document.excerpt ?? ''}`.toLowerCase();
  return haystack.includes('preview') || haystack.includes('local qa');
}

export async function generateMetadata(): Promise<Metadata> {
  const document = await getCurrentDocument('page', 'about');
  if (document === null || isPlaceholderAbout(document)) {
    return pageMetadata({
      title: 'About CERA Medical',
      description:
        'Biomedical research and development, laboratory and computational services in Haripur, Pakistan.',
      path: '/about',
    });
  }
  return pageMetadata({
    title: document.seo.title ?? document.title,
    description: document.seo.description ?? document.excerpt ?? '',
    path: '/about',
    noIndex: document.seo.noIndex,
  });
}

export default async function AboutPage() {
  const document = await getCurrentDocument('page', 'about');
  if (document === null || isPlaceholderAbout(document)) return <AboutProfile />;
  return <CmsContentPage document={document} />;
}
