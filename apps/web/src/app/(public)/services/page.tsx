import { CmsLayout } from '../../../components/cms-content-page.tsx';
import { ServicePortfolio } from '../../../components/services/service-portfolio.tsx';
import { listPublicServices } from '../../../lib/catalogue/client.ts';
import { listPublishedDocuments, getCurrentDocument } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';
import {
  layoutBlocksWithoutServicesChrome,
  servicesCatalogueFromLayout,
  servicesHeroFromLayout,
} from '../../../lib/services-page-layout.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Complete Service Portfolio',
    description:
      'Preclinical studies, molecular research, metagenomic and omics data analysis, and evidence synthesis from CERA Medical.',
    path: '/services',
  });
}

export default async function ServicesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ domain?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [{ degraded, items: catalogueServices }, presentations, servicePage] = await Promise.all([
    listPublicServices(),
    listPublishedDocuments('servicePresentation'),
    getCurrentDocument('page', 'services'),
  ]);
  const bodyBlocks =
    servicePage === null ? [] : layoutBlocksWithoutServicesChrome(servicePage.layout);
  const catalogueLabels = servicesCatalogueFromLayout(servicePage?.layout);
  const cmsHero = servicesHeroFromLayout(servicePage?.layout);
  const domain = params.domain ?? params.category;

  return (
    <>
      <ServicePortfolio
        presentations={presentations}
        catalogueServices={catalogueServices}
        catalogueLabels={catalogueLabels}
        {...(cmsHero === null ? {} : { hero: cmsHero })}
        {...(params.q === undefined ? {} : { query: params.q })}
        {...(domain === undefined ? {} : { domain })}
        {...(degraded ? { degraded: true } : {})}
      />
      {bodyBlocks.length > 0 ? <CmsLayout blocks={bodyBlocks} /> : null}
    </>
  );
}
