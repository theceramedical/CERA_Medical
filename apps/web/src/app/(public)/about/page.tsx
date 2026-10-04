import { CmsContentPage } from '../../../components/cms-content-page.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About CERA Medical',
  description:
    'CERA Medical is a biomedical research and development company based in Haripur, Pakistan.',
};

export default async function AboutPage() {
  const document = await getCurrentDocument('page', 'about');
  if (document === null) return <CmsPageUnavailable slug="about" />;

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
        eyebrow={hero?.eyebrow ?? 'About CERA Medical'}
      />
      <CmsContentPage document={{ ...document, layout: blocks }} skipPageHeader />
    </>
  );
}
