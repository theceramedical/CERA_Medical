import type { ContentDocument } from '@cera/contracts';

import { AboutProfile } from '../../../components/about/about-profile.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

function isPlaceholderAbout(document: ContentDocument): boolean {
  const haystack = `${document.title} ${document.excerpt ?? ''}`.toLowerCase();
  return haystack.includes('preview') || haystack.includes('local qa');
}

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'About CERA Medical',
    description:
      'Biomedical research and development, laboratory and computational services in Haripur, Pakistan.',
    path: '/about',
  });
}

export default async function AboutPage() {
  const document = await getCurrentDocument('page', 'about');
  const teamDocument = document !== null && !isPlaceholderAbout(document) ? document : undefined;
  return <AboutProfile {...(teamDocument === undefined ? {} : { teamDocument })} />;
}
