import { ButtonLink } from '@cera/ui/button';
import { EmptyState } from '@cera/ui/empty-state';
import { Text } from '@cera/ui/typography';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { JsonLd, serviceJsonLd } from '../../../../components/json-ld.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { RichText } from '../../../../components/rich-text.tsx';
import { getPublicService } from '../../../../lib/catalogue/client.ts';
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
  const service = await getPublicService(slug);

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
        {service.availabilityText !== null ? (
          <Text tone="muted">{service.availabilityText}</Text>
        ) : null}
        {service.displayPrice !== null ? (
          <Text className="mt-2">{service.displayPrice}</Text>
        ) : null}

        {presentation !== null ? (
          <RichText body={presentation.body} />
        ) : (
          <Text className="mt-6">{service.description}</Text>
        )}

        {service.enquiryEnabled ? (
          <div className="mt-10">
            <ButtonLink href={`/services/${slug}/enquiry`} as={AppLink}>
              Make an Enquiry
            </ButtonLink>
          </div>
        ) : (
          <Text className="mt-10" tone="muted">
            Enquiries for this service are by referral only.
          </Text>
        )}
      </div>
    </>
  );
}
