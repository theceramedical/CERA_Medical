import { ButtonLink } from '@cera/ui/button';
import { EmptyState } from '@cera/ui/empty-state';
import { Heading, Text } from '@cera/ui/typography';
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { JsonLd, serviceJsonLd } from '../../../../components/json-ld.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { RichText } from '../../../../components/rich-text.tsx';
import { getPublicService, listPublicServices } from '../../../../lib/catalogue/client.ts';
import { getDocument, getPublishedDocument } from '../../../../lib/cms/client.ts';
import { absoluteUrl, pageMetadata } from '../../../../lib/seo.ts';
import { siteUrl } from '../../../../lib/site-url.ts';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [service, presentation] = await Promise.all([
    getPublicService(slug),
    getPublishedDocument('servicePresentation', slug),
  ]);
  if (service === 'gone') {
    return pageMetadata({
      title: 'Service no longer offered',
      description: 'This service is no longer offered by CERA Medical.',
      path: `/services/${slug}`,
      noIndex: true,
    });
  }
  if (service === null) {
    return pageMetadata({
      title: 'Service not found',
      description: 'That service could not be found.',
      path: `/services/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: presentation?.seo.title ?? presentation?.title ?? service.title,
    description: presentation?.seo.description ?? presentation?.excerpt ?? service.summary,
    path: `/services/${slug}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, allServices] = await Promise.all([getPublicService(slug), listPublicServices()]);

  if (service === 'gone') {
    return (
      <div className="mx-auto max-w-site px-6 py-16 md:px-10">
        <EmptyState
          heading="This service is no longer offered"
          description="Travel vaccinations have been withdrawn. Browse current services or make an enquiry about something else."
          action={<AppLink href="/services">View current services</AppLink>}
        />
      </div>
    );
  }

  if (service === null) notFound();

  const draft = await draftMode();
  const presentation = await getDocument('servicePresentation', slug, draft.isEnabled);

  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          origin: siteUrl().origin,
          name: presentation?.title ?? service.title,
          description: presentation?.excerpt ?? service.summary,
          url: absoluteUrl(`/services/${slug}`),
        })}
      />
      <PageHeader
        title={presentation?.title ?? service.title}
        lede={presentation?.excerpt ?? service.summary}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <AppLink
          href="/services"
          className="inline-flex items-center gap-2 text-body-sm font-medium"
        >
          <ArrowLeft aria-hidden className="size-4" /> All services
        </AppLink>
        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article>
            {service.availabilityText !== null ? (
              <Text tone="muted">{service.availabilityText}</Text>
            ) : null}
            {service.displayPrice !== null ? (
              <Text className="mt-2 font-medium">{service.displayPrice}</Text>
            ) : null}
            <div className="mt-6">
              {presentation !== null ? (
                <RichText body={presentation.body} />
              ) : (
                <Text>{service.description}</Text>
              )}
            </div>
          </article>

          <aside className="h-fit rounded-lg border border-border bg-surface-tint p-6 shadow-card">
            <Heading level={2} size="h4">
              Start a project conversation
            </Heading>
            <Text size="body-sm" tone="muted" className="mt-3">
              Tell us about your research question, materials or data, expected outputs and
              timeline. Scope, cost and delivery are agreed in writing before work begins.
            </Text>
            {service.enquiryEnabled ? (
              <ButtonLink
                href={`/services/${slug}/enquiry`}
                as={AppLink}
                className="mt-6 w-full justify-center"
              >
                Request this service
              </ButtonLink>
            ) : (
              <Text size="body-sm" tone="muted" className="mt-6">
                This service is available by referral only.
              </Text>
            )}
            <ul className="mt-6 flex list-none flex-col gap-3 border-t border-border pt-6 p-0">
              <li className="flex gap-3">
                <Clock3 aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                <Text size="body-sm">Reply target: within three working days</Text>
              </li>
              <li className="flex gap-3">
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                <Text size="body-sm">Do not include direct participant identifiers</Text>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                <Text size="body-sm">Protocol, timeline and deliverables documented</Text>
              </li>
            </ul>
          </aside>
        </div>

        {allServices.items.filter((item) => item.slug !== slug).slice(0, 3).length > 0 ? (
          <section
            className="mt-16 border-t border-border pt-12"
            aria-labelledby="related-services-heading"
          >
            <Heading level={2} size="h3" id="related-services-heading">
              Explore related services
            </Heading>
            <ul className="mt-6 grid list-none gap-4 p-0 md:grid-cols-3">
              {allServices.items
                .filter((item) => item.slug !== slug)
                .slice(0, 3)
                .map((item) => (
                  <li key={item.slug}>
                    <AppLink
                      href={`/services/${item.slug}`}
                      className="block rounded-lg border border-border bg-surface p-5 no-underline transition-shadow hover:shadow-card"
                    >
                      <Text className="font-semibold text-copy">{item.title}</Text>
                      <Text size="body-sm" tone="muted" className="mt-2">
                        {item.summary}
                      </Text>
                    </AppLink>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
