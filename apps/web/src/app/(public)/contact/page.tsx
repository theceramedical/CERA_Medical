import { ContactScoping } from '../../../components/contact/contact-scoping.tsx';
import { loadEnquiryFormData } from '../../../lib/enquiry-form-server.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact CERA Medical',
  description:
    'Contact CERA Medical by email or visit its laboratory and office in Haripur, Pakistan.',
};

export default async function ContactPage() {
  const enquiryData = await loadEnquiryFormData();

  return (
    <ContactScoping
      enquiry={{
        startedAt: new Date().toISOString(),
        ...enquiryData,
      }}
    />
  );
}
