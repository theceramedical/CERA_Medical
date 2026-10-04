import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { ContactScoping } from '../../../components/contact/contact-scoping.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { loadEnquiryFormData } from '../../../lib/enquiry-form-server.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact CERA Medical',
  description:
    'Contact CERA Medical by email or visit its laboratory and office in Haripur, Pakistan.',
};

export default async function ContactPage() {
  const [document, enquiryData] = await Promise.all([
    getCurrentDocument('page', 'contact'),
    loadEnquiryFormData(),
  ]);
  if (document === null) return <CmsPageUnavailable slug="contact" />;

  return (
    <ContactScoping
      enquiry={{
        startedAt: new Date().toISOString(),
        ...enquiryData,
      }}
    />
  );
}
