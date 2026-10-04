import { EmptyState } from '@cera/ui/empty-state';

import { CmsLayout } from '../../../components/cms-content-page.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { AppLink } from '../../../components/link.tsx';
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
  const [{ degraded }, presentations, servicePage] = await Promise.all([
    listPublicServices(),
    listPublishedDocuments('servicePresentation'),
    getCurrentDocument('page', 'services'),
  ]);
  if (servicePage === null) return <CmsPageUnavailable slug="services" />;

  const bodyBlocks = layoutBlocksWithoutServicesChrome(servicePage.layout);
  const catalogueLabels = servicesCatalogueFromLayout(servicePage.layout);
  const cmsHero = servicesHeroFromLayout(servicePage.layout);
  const domain = params.domain ?? params.category;

  return (
    <>
      <ServicePortfolio
        presentations={presentations}
        catalogueLabels={catalogueLabels}
        {...(cmsHero === null ? {} : { hero: cmsHero })}
        {...(params.q === undefined ? {} : { query: params.q })}
        {...(domain === undefined ? {} : { domain })}
        {...(degraded ? { degraded: true } : {})}
      />
      {bodyBlocks.length > 0 ? <CmsLayout blocks={bodyBlocks} /> : null}
      {presentations.length === 0 ? (
        <div className="mx-auto max-w-site px-6 pb-12 md:px-10">
          <EmptyState
            heading="Catalogue unavailable"
            description="Browse the service lines above or make an enquiry."
            action={<AppLink href="/enquiry">Make an enquiry</AppLink>}
          />
        </div>
      ) : null}
    </>
  );
}
