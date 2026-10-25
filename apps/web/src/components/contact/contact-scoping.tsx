import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Building2, Mail, MapPin, Microscope } from 'lucide-react';

import { EnquiryForm } from '../enquiry-form.client.tsx';
import { AppLink } from '../link.tsx';

import type { EnquiryFormProps } from '../enquiry-form.client.tsx';

export function ContactScoping({ enquiry }: { readonly enquiry: EnquiryFormProps }) {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10">
          <Heading level={1} size="h1" className="mb-3">
            Contact CERA Medical
          </Heading>
          <Text size="body-lg" tone="muted" className="max-w-3xl">
            Tell us about your research question, samples or data and the results you need. We reply
            to service requests within three working days.
          </Text>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div
              className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8 lg:col-span-7"
              id="enquiry"
            >
              <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
                <div>
                  <Heading level={2} size="h4">
                    Project & Protocol Scoping Form
                  </Heading>
                  <Text size="caption" tone="muted" className="mt-1">
                    Describe your project without including patient names or other identifying
                    details. We will arrange any data or sample transfer separately.
                  </Text>
                </div>
              </div>
              <EnquiryForm {...enquiry} source="web_contact_page" />
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="relative overflow-hidden rounded-lg border border-border border-t-4 border-t-accent bg-surface p-6 shadow-card">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon icon={Microscope} size="lg" className="text-primary" />
                    <Heading level={3} size="h4">
                      Laboratory (by arrangement)
                    </Heading>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-caption text-muted">
                  <Icon icon={MapPin} size="sm" className="mt-0.5 shrink-0 text-accent-fill" />
                  <p>
                    <strong className="text-heading">Room B2-105, B2 Building</strong>
                    <br />
                    Department of Biological and Health Sciences
                    <br />
                    Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology
                    (PAF-IAST)
                    <br />
                    Mang, Haripur, Pakistan.
                  </p>
                </div>
                <div className="mt-3 rounded-md border border-border bg-surface-tint p-3.5">
                  <div className="mb-1 text-caption font-semibold text-heading">
                    Before Sending Samples
                  </div>
                  <Text size="caption" tone="muted">
                    Please contact us first so we can confirm the materials, hazards, shipping
                    arrangements and timing for your project.
                  </Text>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon icon={Building2} size="lg" className="text-primary" />
                    <Heading level={3} size="h4">
                      Office Location
                    </Heading>
                  </div>
                </div>
                <Text size="caption" tone="muted">
                  2nd Floor, BIC,
                  <br />
                  C2 Building, PAF-IAST Campus,
                  <br />
                  Haripur, Pakistan.
                </Text>
                <Text size="caption" className="mt-3 border-t border-border pt-2">
                  <strong>CERA Medical is registered with the SECP.</strong>
                </Text>
              </div>

              <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
                <div className="mb-4 flex items-center gap-2">
                  <Icon icon={Mail} size="lg" className="text-primary" />
                  <Heading level={3} size="h4">
                    Direct Inquiries & Communications
                  </Heading>
                </div>
                <div className="space-y-3">
                  <CommRow
                    icon={Mail}
                    label="Email"
                    value="contact@ceramedical.org"
                    href="mailto:contact@ceramedical.org"
                    note="Service enquiries"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-site px-6 pb-12 md:px-10">
        <Text tone="muted">
          Every project starts with a written scope and protocol and ends with documented results
          and revision rounds. <AppLink href="/methodology">See how we work.</AppLink>
        </Text>
      </div>
    </>
  );
}

function CommRow({
  icon,
  label,
  value,
  href,
  note,
}: {
  readonly icon: typeof Mail;
  readonly label: string;
  readonly value: string;
  readonly href?: string;
  readonly note: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[4px] border border-border bg-surface-tint p-2.5">
      <div className="flex items-center gap-2.5">
        <Icon icon={icon} size="md" className="text-accent-fill" />
        <div>
          <div className="text-[11px] text-muted">{label}</div>
          {href === undefined ? (
            <span className="font-medium text-heading">{value}</span>
          ) : (
            <a className="font-medium text-primary" href={href}>
              {value}
            </a>
          )}
        </div>
      </div>
      <span className="text-[11px] text-muted">{note}</span>
    </div>
  );
}
