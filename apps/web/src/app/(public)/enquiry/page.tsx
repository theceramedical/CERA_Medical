import { EnquiryForm } from '../../../components/enquiry-form.client.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { getPublicGlobal } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Make an Enquiry',
    description:
      'Submit an enquiry about a CERA Medical service and track it in your account. No clinical information is requested.',
    path: '/enquiry',
  });
}

export default async function EnquiryPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ service?: string; source?: string }>;
}) {
  const params = await searchParams;
  const serviceId = params.service;
  const settings = await getPublicGlobal<{ enquiryForm?: Record<string, unknown> }>(
    'site-settings',
  );

  return (
    <>
      <PageHeader
        title="Make an Enquiry"
        lede="Tell us which service you are interested in and how to reach you. We will confirm by email and you can follow progress in your account."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <EnquiryForm
          startedAt={new Date().toISOString()}
          {...(settings?.enquiryForm === undefined ? {} : { copy: settings.enquiryForm })}
          {...(serviceId === undefined ? {} : { defaultServiceId: serviceId })}
          source={params.source === 'web_contact_page' ? 'web_contact_page' : 'web_general'}
        />
      </div>
    </>
  );
}
