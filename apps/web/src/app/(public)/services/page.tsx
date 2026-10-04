import { Alert } from '@cera/ui/alert';
import { EmptyState } from '@cera/ui/empty-state';
import { Icon } from '@cera/ui/icon';
import { ServiceCard } from '@cera/ui/service-card';
import { Text } from '@cera/ui/typography';

import { CmsLayout } from '../../../components/cms-content-page.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { AppLink } from '../../../components/link.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { listPublicServices } from '../../../lib/catalogue/client.ts';
import { listPublishedDocuments, getCurrentDocument } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';
import { pageMetadata } from '../../../lib/seo.ts';
import { serviceCardIcon } from '../../../lib/service-card-icon.ts';
import {
  layoutBlocksWithoutServicesChrome,
  servicesCatalogueFromLayout,
} from '../../../lib/services-page-layout.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research Services',
    description:
      'Preclinical studies, molecular research, metagenomic and omics data analysis, and evidence synthesis from CERA Medical.',
    path: '/services',
  });
}

export default async function ServicesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [{ items, degraded }, presentations, servicePage] = await Promise.all([
    listPublicServices(),
    listPublishedDocuments('servicePresentation'),
    getCurrentDocument('page', 'services'),
  ]);
  if (servicePage === null) return <CmsPageUnavailable slug="services" />;

  const presentationBySlug = new Map(presentations.map((item) => [item.slug, item]));
  const catalogueLabels = servicesCatalogueFromLayout(servicePage.layout);
  const bodyBlocks = layoutBlocksWithoutServicesChrome(servicePage.layout);

  const query = params.q?.trim().toLowerCase() ?? '';
  const category = params.category;

  const filtered = items.filter((service) => {
    if (category !== undefined && service.category?.slug !== category) return false;
    if (query.length === 0) return true;
    const copy = presentationBySlug.get(service.slug);
    const title = copy?.title ?? service.title;
    return (
      title.toLowerCase().includes(query) ||
      (copy?.excerpt ?? service.summary).toLowerCase().includes(query)
    );
  });

  const hero = sectionHeadingFromLayout(servicePage.layout);

  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? servicePage.title}
        lede={hero?.lede ?? servicePage.excerpt ?? ''}
        eyebrow={hero?.eyebrow ?? 'Clinical research infrastructure'}
        {...(hero?.badges !== undefined ? { badges: hero.badges } : {})}
      />

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {degraded ? (
          <Alert className="mb-8" tone="info">
            {catalogueLabels.degradedAlert}
          </Alert>
        ) : null}

        <form method="get" className="mb-10 flex flex-col gap-4 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-2">
            <Text size="caption">{catalogueLabels.searchLabel}</Text>
            <input
              name="q"
              defaultValue={params.q ?? ''}
              className="rounded-md border border-border bg-surface px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-md bg-primary-700 px-4 py-2 text-on-primary">
            {catalogueLabels.applyLabel}
          </button>
        </form>

        {filtered.length === 0 ? (
          <EmptyState
            heading={catalogueLabels.emptyHeading}
            description={catalogueLabels.emptyDescription}
            action={<AppLink href="/services">View all services</AppLink>}
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => {
              const copy = presentationBySlug.get(service.slug);
              const LucideIcon = serviceCardIcon(copy?.cardIcon);
              const highlights = copy?.cardHighlights;
              return (
                <ServiceCard
                  headingLevel={2}
                  key={service.slug}
                  title={copy?.title ?? service.title}
                  description={copy?.excerpt ?? service.summary}
                  href={`/services/${service.slug}`}
                  linkAs={AppLink}
                  {...(LucideIcon === undefined
                    ? {}
                    : { icon: <Icon icon={LucideIcon} size="lg" aria-hidden /> })}
                  {...(highlights === undefined ? {} : { highlights })}
                />
              );
            })}
          </ul>
        )}
      </div>
      {bodyBlocks.length > 0 ? <CmsLayout blocks={bodyBlocks} /> : null}
    </>
  );
}
