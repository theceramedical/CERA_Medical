import { ContactScoping } from '../../../components/contact/contact-scoping.tsx';
import { loadEnquiryFormData } from '../../../lib/enquiry-form-server.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = pageMetadata({
  title: 'Contact CERA Medical',
  description:
    'Contact CERA Medical about your research question, samples or data, or find its laboratory and office in Haripur, Pakistan.',
  path: '/contact',
});

const SERVICE_IDS = new Set([
  'preclinical-studies',
  'molecular-research',
  'biomedical-data-analysis',
  'other-enquiry',
  'research-collaboration',
]);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const service = first(params.service)?.trim();
  const product = first(params.product)?.trim();
  const data = await loadEnquiryFormData();
  return (
    <ContactScoping
      enquiry={{
        startedAt: new Date().toISOString(),
        ...(data.copy === undefined ? {} : { copy: data.copy }),
        ...(service && SERVICE_IDS.has(service)
          ? { defaultServiceId: service }
          : product
            ? { defaultServiceId: 'other-enquiry' }
            : {}),
        ...(product ? { defaultMessage: `Product enquiry for product SKU ${product}.` } : {}),
      }}
    />
  );
}
