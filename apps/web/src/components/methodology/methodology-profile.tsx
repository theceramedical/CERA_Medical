import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { BarChart3, FlaskConical, PawPrint } from 'lucide-react';

const STAGES = [
  {
    title: 'Scoping',
    body: 'Agree the research question, available samples or data, required outputs and project scope.',
  },
  {
    title: 'Protocol',
    body: 'Set out the study protocol or analysis plan before work starts.',
  },
  {
    title: 'Execution',
    body: 'Carry out the agreed laboratory study or data analysis.',
  },
  {
    title: 'Analysis and reporting',
    body: 'Prepare documented results in the agreed format.',
  },
  {
    title: 'Follow-up',
    body: 'Complete revision rounds against the agreed research requirements.',
  },
] as const;

const METHODS = [
  {
    title: 'Preclinical Studies',
    icon: PawPrint,
    summary: 'Testing candidate treatments in animal models, in cells and by computer simulation.',
    points: [
      'In vivo studies with mice, rats, rabbits and guinea pigs',
      'In vitro studies',
      'In silico studies',
    ],
  },
  {
    title: 'Molecular Research',
    icon: FlaskConical,
    summary: 'Molecular, biochemical and histological analysis of research samples.',
    points: [
      'PCR and RT-qPCR',
      'ELISA and Western blot',
      'Sequencing',
      'Histopathology and immunohistochemistry',
    ],
  },
  {
    title: 'Biomedical Data Analysis',
    icon: BarChart3,
    summary: 'Metagenomic, health and omics data analysed through to publication-ready results.',
    points: [
      'Metagenomics',
      'Health and clinical data',
      'Omics data',
      'Evidence synthesis and reports',
    ],
  },
] as const;

export function MethodologyProfile() {
  return (
    <>
      <section
        aria-labelledby="workflow-heading"
        className="border-b border-border bg-surface py-14 md:py-16"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">
            Project workflow
          </Text>
          <Heading id="workflow-heading" level={2} size="h2" className="mt-2">
            How we work
          </Heading>
          <ol className="mt-9 grid list-none gap-px overflow-hidden border border-border bg-border p-0 sm:grid-cols-2 lg:grid-cols-5">
            {STAGES.map((stage, index) => (
              <li key={stage.title} className="flex min-h-48 flex-col bg-surface p-5">
                <span
                  aria-hidden="true"
                  className="font-wordmark text-sm font-bold tracking-[0.12em] text-accent"
                >
                  0{index + 1}
                </span>
                <Heading level={3} size="h4" className="mt-4">
                  {stage.title}
                </Heading>
                <Text size="body-sm" tone="muted" className="mt-2">
                  {stage.body}
                </Text>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="methods-heading"
        className="border-b border-border bg-surface-tint-2 py-14 md:py-16"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">
            Methods by discipline
          </Text>
          <Heading id="methods-heading" level={2} size="h2" className="mt-2">
            Three areas of research
          </Heading>
          <Text size="body-lg" tone="muted" className="mt-3 max-w-3xl">
            Project methods are set out in the written scope and protocol or analysis plan.
          </Text>
          <ul className="mt-9 grid list-none gap-4 p-0 lg:grid-cols-3">
            {METHODS.map((method) => (
              <li key={method.title} className="border border-border bg-surface p-5 sm:p-6">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <Icon icon={method.icon} size="md" />
                </div>
                <Heading level={3} size="h4" className="mt-4">
                  {method.title}
                </Heading>
                <Text size="body-sm" tone="muted" className="mt-2">
                  {method.summary}
                </Text>
                <ul className="mt-5 list-none space-y-2 border-t border-border pt-4 p-0">
                  {method.points.map((point) => (
                    <li key={point} className="flex gap-2 text-body-sm text-copy">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
