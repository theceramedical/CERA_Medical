import { Alert } from '@cera/ui/alert';
import { EmptyState } from '@cera/ui/empty-state';
import { ServiceCard } from '@cera/ui/service-card';
import { Text } from '@cera/ui/typography';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { HOMEPAGE_SERVICES } from '../../../content/homepage.ts';
import { listPublicServices } from '../../../lib/catalogue/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

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
  const { items, degraded } = await listPublicServices();

  const query = params.q?.trim().toLowerCase() ?? '';
  const category = params.category;

  const filtered = items.filter((service) => {
    if (category !== undefined && service.category?.slug !== category) return false;
    if (query.length === 0) return true;
    return (
      service.title.toLowerCase().includes(query) || service.summary.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <PageHeader
        title="Complete Service Portfolio"
        lede="CERA Medical is a biomedical research and development company. We test candidate treatments in animal models, cells and computer simulations; run molecular laboratory work; analyse microbiome, omics and clinical data; and prepare evidence reviews and technical reports."
      />

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {degraded ? (
          <Alert className="mb-8" tone="info">
            Live catalogue data is temporarily unavailable. Showing the last known services.
          </Alert>
        ) : null}

        <form method="get" className="mb-10 flex flex-col gap-4 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-2">
            <Text size="caption">Search services</Text>
            <input
              name="q"
              defaultValue={params.q ?? ''}
              className="rounded-md border border-border bg-surface px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-md bg-primary-700 px-4 py-2 text-on-primary">
            Apply
          </button>
        </form>

        {filtered.length === 0 ? (
          <EmptyState
            heading="No services match those filters"
            description="Clear the search or browse the full list of research services."
            action={<AppLink href="/services">View all services</AppLink>}
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((service) => {
              const icon = HOMEPAGE_SERVICES.find((item) => item.slug === service.slug)?.icon;
              const Icon = icon;
              return (
                <ServiceCard
                  headingLevel={2}
                  key={service.slug}
                  title={service.title}
                  description={service.summary}
                  href={`/services/${service.slug}`}
                  linkAs={AppLink}
                  {...(Icon === undefined ? {} : { icon: <Icon aria-hidden /> })}
                />
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
