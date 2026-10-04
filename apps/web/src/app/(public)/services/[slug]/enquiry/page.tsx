import { EmptyState } from '@cera/ui/empty-state';
import { notFound } from 'next/navigation';

import { EnquiryForm } from '../../../../../components/enquiry-form.client.tsx';
import { AppLink } from '../../../../../components/link.tsx';
import { PageHeader } from '../../../../../components/page-header.tsx';
import { getPublicService } from '../../../../../lib/catalogue/client.ts';
import { getPublishedDocument } from '../../../../../lib/cms/client.ts';
import { loadEnquiryFormData } from '../../../../../lib/enquiry-form-server.ts';
import { pageMetadata } from '../../../../../lib/seo.ts';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicService(slug);
  if (service === null || service === 'gone') {
    return pageMetadata({
      title: 'Enquiry',
      description: 'Enquire about a CERA Medical service.',
      path: `/services/${slug}/enquiry`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: `Enquire about ${service.title}`,
    description: `Submit an enquiry about ${service.title}. No clinical information is requested.`,
    path: `/services/${slug}/enquiry`,
  });
}

export default async function ServiceEnquiryPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getPublicService(slug);
  const [presentation, enquiryData] = await Promise.all([
    getPublishedDocument('servicePresentation', slug),
    loadEnquiryFormData(),
  ]);
  if (service === 'gone' || service === null) notFound();
  const serviceTitle = presentation?.title ?? service.title;

  if (!service.enquiryEnabled) {
    return (
      <div className="mx-auto max-w-site px-6 py-16 md:px-10">
        <EmptyState
          heading="Enquiries are by referral only"
          description={`${serviceTitle} is not available through the public enquiry form.`}
          action={<AppLink href="/services">View other services</AppLink>}
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Enquire about ${serviceTitle}`}
        lede="Tell us how to reach you. Do not include symptoms, conditions, or test results."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <EnquiryForm
          startedAt={new Date().toISOString()}
          {...enquiryData}
          defaultServiceId={slug}
          source="web_service_page"
          serviceLocked
        />
      </div>
    </>
  );
}
