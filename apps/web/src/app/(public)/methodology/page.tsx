import { CmsContentPage } from '../../../components/cms-content-page.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
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
  if (document === null) return <CmsPageUnavailable slug="methodology" />;

  const hero = sectionHeadingFromLayout(document.layout);
  const blocks = Array.isArray(document.layout)
    ? (document.layout as { blockType?: string }[]).filter(
        (block) => block.blockType !== 'sectionHeading',
      )
    : [];

  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? document.title}
        lede={hero?.lede ?? document.excerpt ?? ''}
        eyebrow={hero?.eyebrow ?? 'Methodology'}
      />
      <CmsContentPage document={{ ...document, layout: blocks }} skipPageHeader />
    </>
  );
}
