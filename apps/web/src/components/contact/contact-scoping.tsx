import { Heading, Text } from '@cera/ui/typography';
import { Mail, MapPin } from 'lucide-react';

import { EnquiryForm } from '../enquiry-form.client.tsx';

import type { EnquiryFormProps } from '../enquiry-form.client.tsx';
import type { ReactNode } from 'react';

const CONTACT_SERVICES = [
  { slug: 'preclinical-studies', title: 'Preclinical Studies' },
  { slug: 'molecular-research', title: 'Molecular Research' },
  { slug: 'biomedical-data-analysis', title: 'Biomedical Data Analysis' },
  { slug: 'other-enquiry', title: 'Product enquiry' },
  { slug: 'research-collaboration', title: 'Research collaboration' },
  { slug: 'other-enquiry', title: 'Other enquiry' },
] as const;

export function ContactScoping({
  enquiry,
  copy,
}: {
  readonly enquiry: Omit<EnquiryFormProps, 'services' | 'source'>;
  readonly copy?: { readonly heading?: string; readonly introduction?: string };
}) {
  return (
    <>
      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">
            Contact
          </Text>
          <Heading level={1} size="h1" className="mt-3">
            {copy?.heading ?? 'Contact CERA Medical'}
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-4 max-w-3xl">
            {copy?.introduction ??
              'Tell us about your research question, samples or data and the results you need. We reply to service requests within three working days.'}
          </Text>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto grid max-w-site gap-8 px-6 md:px-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
          <div
            id="contact-form"
            className="scroll-mt-28 border border-border bg-surface p-5 sm:p-8"
          >
            <div className="mb-7 border-b border-border pb-5">
              <Heading level={2} size="h3">
                Send an enquiry
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-2 max-w-2xl">
                Describe your research request. Do not include patient names or other identifying
                details.
              </Text>
            </div>
            <EnquiryForm {...enquiry} source="web_contact_page" services={CONTACT_SERVICES} />
          </div>

          <aside aria-label="Contact details" className="space-y-4">
            <ContactCard
              icon={<MapPin size={19} aria-hidden="true" />}
              title="Laboratory (by arrangement)"
            >
              Room B2-105, B2 Building, Department of Biological and Health Sciences, PAF-IAST,
              Mang, Haripur, Pakistan.
            </ContactCard>
            <ContactCard icon={<MapPin size={19} aria-hidden="true" />} title="Office">
              2nd Floor, BIC, C2 Building, PAF-IAST Campus, Haripur, Pakistan.
            </ContactCard>
            <ContactCard icon={<Mail size={19} aria-hidden="true" />} title="Email">
              <a
                className="font-semibold text-primary underline underline-offset-4"
                href="mailto:contact@ceramedical.org"
              >
                contact@ceramedical.org
              </a>
            </ContactCard>
          </aside>
        </div>
      </section>
    </>
  );
}

function ContactCard({
  icon,
  title,
  children,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="border border-border bg-surface p-5">
      <div className="flex items-center gap-3 text-accent">
        {icon}
        <Heading level={2} size="h4" className="text-heading">
          {title}
        </Heading>
      </div>
      <Text size="body-sm" tone="muted" className="mt-3 leading-relaxed">
        {children}
      </Text>
    </section>
  );
}
