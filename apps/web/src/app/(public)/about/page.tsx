import type { ContentDocument } from '@cera/contracts';

import { AboutProfile } from '../../../components/about/about-profile.tsx';
import { ApprovedTeamSection } from '../../../components/about/approved-team-section.tsx';
import { CmsContentPage } from '../../../components/cms-content-page.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { getPublishedTeamMembers } from '../../../lib/cms/public-research-content.ts';
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
  const [document, teamMembers] = await Promise.all([
    getCurrentDocument('page', 'about'),
    getPublishedTeamMembers(),
  ]);
  if (document === null || isPlaceholderAbout(document)) {
    return <AboutProfile teamMembers={teamMembers} />;
  }
  // Legacy page-level team rows do not carry the confirmation/photo approval
  // gate enforced by the dedicated TeamMembers collection.
  return (
    <>
      <CmsContentPage document={{ ...document, teamMembers: [] }} />
      <ApprovedTeamSection teamMembers={teamMembers} />
    </>
  );
}
