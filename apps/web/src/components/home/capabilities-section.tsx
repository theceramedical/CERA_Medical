import { Icon } from '@cera/ui/icon';
import { SectionHeader } from '@cera/ui/section-header';
import { Heading, Text } from '@cera/ui/typography';
import { Cpu, FlaskConical, ShieldCheck } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'Laboratory capability',
    description:
      'Preclinical, molecular, genomics, histopathology and microscopy work delivered through coordinated laboratory services.',
    icon: FlaskConical,
  },
  {
    title: 'Computational research',
    description:
      'Bioinformatics, omics analysis and simulation workflows designed for clear, publication-ready outputs.',
    icon: Cpu,
  },
  {
    title: 'Confidential by design',
    description:
      'Controlled access, documented methods and a clear process for handling research material and data.',
    icon: ShieldCheck,
  },
] as const;

export function CapabilitiesSection() {
  return (
    <section aria-labelledby="capabilities-heading" className="bg-surface-tint">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-20">
        <SectionHeader
          level={2}
          heading={<span id="capabilities-heading">Built for rigorous research</span>}
          subheading="One team for laboratory studies, computational analysis and evidence you can use."
        />
        <ul className="mt-10 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <li
              key={capability.title}
              className="rounded-lg border border-border bg-surface p-7 shadow-card"
            >
              <Icon icon={capability.icon} size="lg" className="text-accent" />
              <Heading level={3} size="h4" className="mt-5">
                {capability.title}
              </Heading>
              <Text tone="muted" className="mt-3">
                {capability.description}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
