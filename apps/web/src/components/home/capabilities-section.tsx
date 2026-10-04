import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Cpu, FlaskConical, ShieldCheck } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'Laboratory capability',
    description:
      'Preclinical, molecular, genomics, histopathology and microscopy work delivered through coordinated laboratory services.',
    icon: FlaskConical,
    accent: 'border-t-accent',
    iconClass: 'text-accent',
  },
  {
    title: 'Computational research',
    description:
      'Bioinformatics, omics analysis and simulation workflows designed for clear, publication-ready outputs and auditable records.',
    icon: Cpu,
    accent: 'border-t-primary',
    iconClass: 'text-primary',
  },
  {
    title: 'Confidential by design',
    description:
      'Controlled access, documented methods and a clear process for handling research material and confidential trial data.',
    icon: ShieldCheck,
    accent: 'border-t-primary-900',
    iconClass: 'text-primary-900',
  },
] as const;

export function CapabilitiesSection({
  eyebrow = 'Methodological rigor',
  heading = 'Built for Rigorous Research',
  subheading = 'One team for laboratory studies, computational analysis and evidence you can use.',
  items,
}: {
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly items?: readonly { title: string; description: string }[];
}) {
  const cards =
    items !== undefined && items.length > 0
      ? items.map((item, index) => ({
          ...item,
          icon: CAPABILITIES[index]?.icon ?? FlaskConical,
          accent: CAPABILITIES[index]?.accent ?? 'border-t-accent',
          iconClass: CAPABILITIES[index]?.iconClass ?? 'text-accent',
        }))
      : CAPABILITIES;

  return (
    <section
      aria-labelledby="capabilities-heading"
      className="border-b border-border bg-surface-tint-2 py-16"
    >
      <div className="mx-auto max-w-site px-6 md:px-10">
        <div className="mb-12 max-w-2xl">
          <Text
            as="p"
            size="eyebrow"
            className="font-semibold tracking-widest text-accent uppercase"
          >
            {eyebrow}
          </Text>
          <Heading level={2} size="h2" id="capabilities-heading" className="mt-1 mb-2">
            {heading}
          </Heading>
          <Text tone="muted">{subheading}</Text>
        </div>
        <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {cards.map((capability) => (
            <li
              key={capability.title}
              className={`rounded-lg border border-x border-b border-t-4 ${capability.accent} border-border bg-surface p-6 shadow-card`}
            >
              <Icon icon={capability.icon} size="lg" className={`mb-3 ${capability.iconClass}`} />
              <Heading level={3} size="h4" className="mb-2">
                {capability.title}
              </Heading>
              <Text size="body-sm" tone="muted">
                {capability.description}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
