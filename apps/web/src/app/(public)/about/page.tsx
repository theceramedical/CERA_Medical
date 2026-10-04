import { AboutProfile } from '../../../components/about/about-profile.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About CERA Medical',
  description:
    'CERA Medical is a biomedical research and development company based in Haripur, Pakistan.',
};

export default async function AboutPage() {
  const document = await getCurrentDocument('page', 'about');
  if (document === null) return <CmsPageUnavailable slug="about" />;
  return <AboutProfile />;
}
