import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Building2, Clock3, Mail, MapPin, Microscope, ShieldCheck } from 'lucide-react';

import { EnquiryForm } from '../enquiry-form.client.tsx';
import { AppButtonLink } from '../link.tsx';

import type { EnquiryFormProps } from '../enquiry-form.client.tsx';

const TRUST = [
  { title: 'Response Target', value: 'Within 3 Working Days' },
  { title: 'Research Scope', value: 'Agreed in Writing' },
  { title: 'Study Plan', value: 'Protocol Before Work' },
  { title: 'Animal Studies', value: 'Ethics Approval Required' },
] as const;

const FAQS = [
  {
    q: 'How does CERA Medical handle ethics and animal welfare?',
    a: 'Animal studies begin only after the protocol has been approved by the institutional animal ethics committee. We define the study design, controls and endpoints before work starts.',
  },
  {
    q: 'Can external research sponsors visit the laboratory?',
    a: 'Please contact us to discuss any proposed visit or transfer of samples. We will confirm practical arrangements for your specific project before you travel or send materials.',
  },
  {
    q: 'What is the sample de-identification requirement?',
    a: 'Provide de-identified files and coded samples without names, contact details, identity numbers or medical record numbers. If identifiers are necessary for an analysis, agree a data sharing arrangement before transfer.',
  },
  {
    q: 'Do you provide formal quotes for grant applications?',
    a: 'We agree the scope, timeline, cost and expected outputs in writing before work starts. Describe your grant or procurement requirements in the enquiry form so we can discuss the appropriate documentation.',
  },
] as const;

export function ContactScoping({ enquiry }: { readonly enquiry: EnquiryFormProps }) {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10">
          <p className="mb-4 inline-flex items-center gap-2 rounded-sm border border-accent bg-surface-tint px-3 py-1 text-caption font-semibold tracking-wider text-accent-fill uppercase">
            INSTITUTIONAL ACCESS & STUDY SCOPING
          </p>
          <Heading level={1} size="h1" className="mb-3">
            Contact CERA Medical
          </Heading>
          <Text size="body-lg" tone="muted" className="mb-8 max-w-3xl">
            Tell us about your research question, samples or data and the results you need. We aim
            to reply to service requests within three working days.
          </Text>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-tint p-3"
              >
                <Icon icon={Clock3} size="lg" className="text-accent-fill" />
                <div>
                  <div className="text-caption text-heading">{item.title}</div>
                  <div className="text-caption font-medium text-muted">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div
              className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8 lg:col-span-7"
              id="scoping-form"
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
                <span className="rounded-sm border border-accent bg-surface-tint px-2.5 py-1 text-[11px] font-semibold text-accent-fill">
                  SERVICE REQUEST
                </span>
              </div>
              <EnquiryForm {...enquiry} source="web_contact_page" />
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="relative overflow-hidden rounded-lg border border-border border-t-4 border-t-accent bg-surface p-6 shadow-card">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon icon={Microscope} size="lg" className="text-primary" />
                    <Heading level={3} size="h4">
                      Laboratory Location
                    </Heading>
                  </div>
                  <span className="shrink-0 rounded-sm border border-accent bg-surface-tint px-2 py-0.5 text-[11px] font-medium text-accent-fill">
                    By Arrangement
                  </span>
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
                  <span className="rounded-sm border border-border bg-surface-tint px-2 py-0.5 text-[11px] text-muted">
                    Haripur
                  </span>
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
                    label="Primary Institutional Email"
                    value="contact@ceramedical.org"
                    href="mailto:contact@ceramedical.org"
                    note="Service enquiries"
                  />
                  <CommRow
                    icon={Mail}
                    label="Alternative Email"
                    value="theceramedical@gmail.com"
                    href="mailto:theceramedical@gmail.com"
                    note="Email"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-caption text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Icon icon={ShieldCheck} size="sm" className="text-accent-fill" />
                    Response target:
                  </span>
                  <span className="font-semibold text-heading">Within 3 working days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-tint py-12 md:py-16">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <p className="mb-2 text-caption font-semibold tracking-wider text-accent-fill uppercase">
            Institutional Governance
          </p>
          <Heading level={2} size="h2">
            Frequently Asked Scoping & Governance Questions
          </Heading>
          <Text tone="muted" className="mt-2 mb-8 max-w-2xl">
            Institutional guidelines governing research collaboration, biological transfer, and
            contractual compliance.
          </Text>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {FAQS.map((item) => (
              <div
                key={item.q}
                className="rounded-lg border border-border bg-surface p-6 shadow-card"
              >
                <Heading level={3} size="h4" className="mb-2">
                  {item.q}
                </Heading>
                <Text size="caption" tone="muted">
                  {item.a}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-800 py-12 text-on-primary">
        <div className="mx-auto flex max-w-site flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-10">
          <div>
            <Heading level={2} size="h3" className="text-on-primary">
              Need Immediate Technical Clarification with a Study Director?
            </Heading>
            <Text className="mt-1 max-w-xl text-on-primary/90">
              Send your research question and requirements to start a project discussion.
            </Text>
          </div>
          <AppButtonLink href="/enquiry" variant="accent">
            Open a Scoping Conversation
          </AppButtonLink>
        </div>
      </section>
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
