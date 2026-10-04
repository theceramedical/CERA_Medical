import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Building2, Clock3, Mail, MapPin, Microscope, Phone, ShieldCheck } from 'lucide-react';

import { EnquiryForm } from '../enquiry-form.client.tsx';
import { AppButtonLink } from '../link.tsx';

import type { EnquiryFormProps } from '../enquiry-form.client.tsx';

const TRUST = [
  { title: 'Response Target', value: '< 3 Working Days' },
  { title: 'Biosafety Intake', value: 'BSL-2 Validated' },
  { title: 'Quality Alignment', value: 'ISO 15189 / GLP' },
  { title: 'Ethics Pathway', value: 'IAEC Cleared Protocols' },
] as const;

const FAQS = [
  {
    q: 'How does CERA Medical handle ethics and animal welfare?',
    a: 'All in vivo studies strictly require Institutional Animal Ethics Committee (IAEC) approval prior to commencement. We operate in strict adherence to the internationally recognized 3Rs principles (Replacement, Reduction, and Refinement) and standard veterinary welfare parameters.',
  },
  {
    q: 'Can external research sponsors visit the laboratory?',
    a: 'Yes. In-person facility audits, project oversight sessions, and physical specimen drop-offs are fully supported. In-person access requires protocol clearance and prior security notification for access to the PAF-IAST Haripur campus.',
  },
  {
    q: 'What is the sample de-identification requirement?',
    a: 'We enforce a strict Zero Protected Health Information (Zero PII) policy. All human, clinical, or biological specimens must be pre-coded with alphanumeric 2D barcoded IDs before physical accession or digital database ingest.',
  },
  {
    q: 'Do you provide formal quotes for grant applications?',
    a: 'Yes. We routinely generate institutional Letters of Support (LoS), formalized budgetary line-item schedules, and methodology descriptions for national and international grant submissions within 5 working days.',
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
            Connect directly with our study directors, principal investigators, and laboratory
            management at the Haripur Research Facility. We reply to all protocol and evidence
            scoping inquiries within three working days.
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
                    Submit pre-trial specs, molecular requests, or bioinformatic datasets for
                    scientific triage.
                  </Text>
                </div>
                <span className="rounded-sm border border-accent bg-surface-tint px-2.5 py-1 text-[11px] font-semibold text-accent-fill">
                  CRF-2025/SCOPING
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
                      Physical Laboratory & Specimen Reception
                    </Heading>
                  </div>
                  <span className="shrink-0 rounded-sm border border-accent bg-surface-tint px-2 py-0.5 text-[11px] font-medium text-accent-fill">
                    BSL-2 Validated Intake
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
                    Khanpur Road, Mang, Haripur, Khyber Pakhtunkhwa, Pakistan.
                  </p>
                </div>
                <div className="mt-3 rounded-md border border-border bg-surface-tint p-3.5">
                  <div className="mb-1 text-caption font-semibold text-heading">
                    Specimen Delivery Protocol
                  </div>
                  <Text size="caption" tone="muted">
                    Specimen intake hours: Monday–Friday 09:00–16:00 PKT. Prior cold-chain
                    notification required 48 hours prior to dry ice/liquid nitrogen delivery.
                  </Text>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon icon={Building2} size="lg" className="text-primary" />
                    <Heading level={3} size="h4">
                      Administrative & Executive Directorate
                    </Heading>
                  </div>
                  <span className="rounded-sm border border-border bg-surface-tint px-2 py-0.5 text-[11px] text-muted">
                    SECP Islamabad
                  </span>
                </div>
                <Text size="caption" tone="muted">
                  2nd Floor, Business Incubation Center (BIC),
                  <br />
                  C2 Building, PAF-IAST Campus,
                  <br />
                  Haripur, Pakistan.
                </Text>
                <Text size="caption" className="mt-3 border-t border-border pt-2">
                  SECP Corporate Registration:{' '}
                  <strong>CERA Medical R&D Ltd. (Sec. 42 / Non-Profit / Life Sciences)</strong>
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
                    note="Encrypted"
                  />
                  <CommRow
                    icon={Mail}
                    label="Secondary / Urgent Inquiries"
                    value="theceramedica@gmail.com"
                    href="mailto:theceramedica@gmail.com"
                    note="Mirror Inbox"
                  />
                  <CommRow
                    icon={Phone}
                    label="Direct Lab Line / Study Desk"
                    value="+92 (0) 995 645112"
                    note="09:00 - 17:00 PKT"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-caption text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Icon icon={ShieldCheck} size="sm" className="text-accent-fill" />
                    Formal Scoping SLA:
                  </span>
                  <span className="font-semibold text-heading">Written Document ≤ 72 Hours</span>
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
              Our principal investigators and laboratory specialists are available for direct
              protocol feasibility assessments.
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
