import { EnquiryForm } from '../../../components/enquiry-form.client.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';
import { loadEnquiryFormData } from '../../../lib/enquiry-form-server.ts';
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
  readonly searchParams: Promise<{ service?: string; source?: string; product?: string }>;
}) {
  const params = await searchParams;
  const serviceId = params.service;
  const productSku = params.product?.trim();
  const [page, enquiryData] = await Promise.all([
    getCurrentDocument('page', 'enquiry'),
    loadEnquiryFormData(),
  ]);
  const hero = page === null ? null : sectionHeadingFromLayout(page.layout);
  const defaultMessage =
    productSku !== undefined && productSku.length > 0
      ? `Institutional quotation requested for catalog SKU ${productSku}. Please include intended research quantity, shipping destination, and any MTA requirements. Do not include patient names or other identifying details.`
      : undefined;

  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? page?.title ?? 'Make an Enquiry'}
        lede={
          hero?.lede ??
          page?.excerpt ??
          'Tell us which service you are interested in and how to reach you. We will confirm by email and you can follow progress in your account.'
        }
        eyebrow={hero?.eyebrow ?? 'Project enquiry'}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <EnquiryForm
          startedAt={new Date().toISOString()}
          {...enquiryData}
          {...(serviceId === undefined ? {} : { defaultServiceId: serviceId })}
          {...(defaultMessage === undefined ? {} : { defaultMessage })}
          source={params.source === 'web_contact_page' ? 'web_contact_page' : 'web_general'}
        />
      </div>
    </>
  );
}
