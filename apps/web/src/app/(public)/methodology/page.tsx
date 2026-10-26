import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { MethodologyProfile } from '../../../components/methodology/methodology-profile.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Methodology',
    description:
      'How CERA Medical scopes, conducts, analyses and reports research service projects.',
    path: '/methodology',
  });
}

export default async function MethodologyPage() {
  const document = await getCurrentDocument('page', 'methodology');
  const hero = sectionHeadingFromLayout(document?.layout);
  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? document?.title ?? 'Methodology'}
        lede={
          hero?.lede ??
          document?.excerpt ??
          'Every project starts with a written scope and protocol and ends with documented results and revision rounds.'
        }
        eyebrow={hero?.eyebrow ?? 'How we work'}
      />
      <MethodologyProfile />
    </>
  );
}
