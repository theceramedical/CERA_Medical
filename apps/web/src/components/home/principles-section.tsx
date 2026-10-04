import { Icon } from '@cera/ui/icon';
import { IconDisc } from '@cera/ui/icon-disc';
import { SectionHeader } from '@cera/ui/section-header';
import { Heading, Text } from '@cera/ui/typography';

import { HOMEPAGE_PRINCIPLES } from '../../content/homepage.ts';

export function PrinciplesSection() {
  return (
    <section aria-labelledby="principles-heading" className="bg-surface-tint">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-20">
        <SectionHeader
          level={2}
          heading={<span id="principles-heading">How we work with partners</span>}
          subheading="Principles that apply to every service line — from preclinical studies to omics analysis and evidence reports."
        />
        <ul className="mt-12 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2">
          {HOMEPAGE_PRINCIPLES.map((principle) => (
            <li
              key={principle.title}
              className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-7 shadow-card"
            >
              <IconDisc tone="accent">
                <Icon icon={principle.icon} size="lg" />
              </IconDisc>
              <Heading level={3} size="h4">
                {principle.title}
              </Heading>
              <Text tone="muted">{principle.description}</Text>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
