import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import {
  BarChart3,
  ClipboardList,
  Dna,
  FileCheck2,
  FlaskConical,
  Microscope,
  PawPrint,
} from 'lucide-react';

import { HOMEPAGE_PROCESS } from '../../content/homepage.ts';
import { AppButtonLink } from '../link.tsx';

const SERVICE_METHODOLOGY = [
  {
    title: 'Preclinical studies',
    icon: PawPrint,
    accent: 'border-t-primary',
    summary:
      'In vivo, in vitro, and in silico work scoped under institutional ethics with written protocols before samples move.',
    points: [
      'Rodent and lagomorph models with documented welfare and endpoint criteria',
      'Cell-based assays with defined controls, replicates, and acceptance limits',
      'In silico docking and dynamics when computational evidence supports the study plan',
    ],
  },
  {
    title: 'Molecular research',
    icon: FlaskConical,
    accent: 'border-t-accent',
    summary:
      'BSL-2 laboratory methods with batch records, calibrated instruments, and traceable reagent lots.',
    points: [
      'Nucleic acid extraction, PCR, sequencing, and immunoassays under SOPs',
      'Histology and microscopy with documented staining and imaging parameters',
      'Results packaged with methods text suitable for publication or regulatory review',
    ],
  },
  {
    title: 'Metagenomic data analysis',
    icon: Microscope,
    accent: 'border-t-primary',
    summary:
      'From raw reads through taxonomic and functional profiles with reproducible Nextflow-style workflows.',
    points: [
      'Quality control, host removal, and contamination screening documented per run',
      'Kraken2, QIIME 2, or project-specific pipelines version-locked in containers',
      'Typical delivery target within three weeks, subject to agreed scope and data volume',
    ],
  },
  {
    title: 'Biomedical & omics analysis',
    icon: Dna,
    accent: 'border-t-accent',
    summary:
      'RNA-seq, variant calling, and clinical–omics integration with biostatistics and figure traceability.',
    points: [
      'Normalization, differential expression, and pathway analysis with explicit parameters',
      'Variant annotation workflows and sensitivity analyses when clinically relevant',
      'Tables and figures linked to underlying data for reviewer questions',
    ],
  },
  {
    title: 'Evidence synthesis & reports',
    icon: BarChart3,
    accent: 'border-t-primary',
    summary:
      'Systematic reviews, technical reports, and policy briefs aligned to PRISMA-style transparency.',
    points: [
      'Registered protocols, search strategies, and screening logs on request',
      'Risk-of-bias tools and GRADE-style certainty language where appropriate',
      'Deliverables formatted for internal decision-making or external publication',
    ],
  },
] as const;

export function MethodologyProfile() {
  return (
    <>
      <section className="border-b border-border bg-surface py-14 md:py-16">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div className="mb-10 max-w-2xl">
            <Text size="eyebrow" className="font-semibold tracking-widest text-accent uppercase">
              Five agreed stages
            </Text>
            <Heading level={2} size="h2" className="mt-3">
              How every project runs
            </Heading>
            <Text size="body-lg" tone="muted" measure className="mt-4">
              Whether the work is laboratory, computational, or evidence-based, CERA Medical uses
              the same staged workflow. Each stage has a written output so sponsors know what was
              agreed and what was delivered.
            </Text>
          </div>
          <ol className="grid list-none gap-4 p-0 lg:grid-cols-5">
            {HOMEPAGE_PROCESS.map((step, index) => (
              <li
                key={step.title}
                className="relative flex flex-col rounded-lg border border-border bg-surface-subtle p-5 shadow-card"
              >
                <span className="mb-3 font-wordmark text-h4 font-bold text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Heading level={3} size="h4">
                  {step.title}
                </Heading>
                <Text size="body-sm" tone="muted" className="mt-2 flex-1">
                  {step.description}
                </Text>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border bg-surface-tint py-14 md:py-16">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div className="mb-10 max-w-2xl">
            <Text size="eyebrow" className="font-semibold tracking-widest text-accent uppercase">
              Service lines
            </Text>
            <Heading level={2} size="h2" className="mt-3">
              Methods by discipline
            </Heading>
            <Text size="body-lg" tone="muted" measure className="mt-4">
              Service-specific protocols and analysis plans are agreed during scoping. The summaries
              below describe how CERA typically structures each line of work.
            </Text>
          </div>
          <ul className="grid list-none gap-6 p-0 lg:grid-cols-2">
            {SERVICE_METHODOLOGY.map((line) => (
              <li
                key={line.title}
                className={`rounded-lg border border-border border-t-4 bg-surface p-6 shadow-card ${line.accent}`}
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-surface-tint text-primary">
                  <Icon icon={line.icon} size="md" />
                </div>
                <Heading level={3} size="h4">
                  {line.title}
                </Heading>
                <Text size="body-sm" tone="muted" className="mt-2">
                  {line.summary}
                </Text>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-body-sm text-muted">
                  {line.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-14 md:py-16">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-surface-tint text-primary">
                <Icon icon={FileCheck2} size="lg" />
              </div>
              <Heading level={2} size="h3">
                Quality checks you can point to
              </Heading>
              <Text tone="muted" className="mt-4">
                Protocols, software versions, and instrument calibration records are retained for
                the project retention period. Customer-facing reports separate findings from
                operational notes; staff-only triage stays in the secure portal.
              </Text>
            </div>
            <div className="rounded-lg border border-border bg-surface-tint p-6 shadow-card">
              <div className="flex items-start gap-3">
                <Icon icon={ClipboardList} size="md" className="mt-0.5 text-accent" />
                <div>
                  <Heading level={3} size="h4">
                    Before work starts
                  </Heading>
                  <Text size="body-sm" tone="muted" className="mt-2">
                    Written scope, ethics or data-governance confirmations where required, and a
                    signed-off protocol or analysis plan. No laboratory or compute work without that
                    baseline.
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-linear-to-r from-gradient-from to-gradient-to py-14 md:py-16">
        <div className="mx-auto flex max-w-site flex-col items-start gap-6 px-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="max-w-xl">
            <Heading level={2} size="h3" tone="on-dark">
              Ready to align on methods?
            </Heading>
            <Text tone="on-dark" className="mt-3 opacity-90">
              Share your research question and available materials. We respond within three working
              days with scoping questions and next steps.
            </Text>
          </div>
          <AppButtonLink href="/enquiry" variant="on-dark" size="md">
            Make an Enquiry
          </AppButtonLink>
        </div>
      </section>
    </>
  );
}
