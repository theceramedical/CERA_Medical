import { ContactScoping } from '../../../components/contact/contact-scoping.tsx';
import { loadEnquiryFormData } from '../../../lib/enquiry-form-server.ts';

import type { Metadata } from 'next';

const LEGACY_DATA_SERVICE_IDS = new Set([
  'metagenomic-data-analysis',
  'biomedical-omics-data-analysis',
  'evidence-synthesis-technical-reports',
]);

export const metadata: Metadata = {
  title: 'Contact CERA Medical',
  description:
    'Contact CERA Medical by email or visit its laboratory and office in Haripur, Pakistan.',
};

export default async function ContactPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ product?: string; service?: string }>;
}) {
  const params = await searchParams;
  const productSku = params.product?.trim().slice(0, 64);
  const hasProductSku = productSku !== undefined && productSku.length > 0;
  const serviceId = hasProductSku
    ? 'product-enquiry'
    : params.service === undefined
      ? undefined
      : LEGACY_DATA_SERVICE_IDS.has(params.service)
        ? 'biomedical-data-analysis'
        : params.service;
  const enquiryData = await loadEnquiryFormData();
  const defaultServiceId = enquiryData.services.some((service) => service.slug === serviceId)
    ? serviceId
    : undefined;

  return (
    <ContactScoping
      enquiry={{
        startedAt: new Date().toISOString(),
        ...(defaultServiceId === undefined ? {} : { defaultServiceId }),
        ...(hasProductSku
          ? { defaultMessage: `Product enquiry for catalogue SKU ${productSku}.` }
          : {}),
        ...enquiryData,
      }}
    />
  );
}
