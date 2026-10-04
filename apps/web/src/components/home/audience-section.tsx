import { Icon } from '@cera/ui/icon';
import { IconDisc } from '@cera/ui/icon-disc';
import { SectionHeader } from '@cera/ui/section-header';
import { Heading, Text } from '@cera/ui/typography';

import { HOMEPAGE_AUDIENCES } from '../../content/homepage.ts';

/**
 * Who CERA serves — research buyers rather than consumer health visitors.
 */
export function AudienceSection() {
  return (
    <section aria-labelledby="audience-heading" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-20">
        <Text as="p" size="eyebrow" tone="muted" className="text-center uppercase tracking-widest">
          Audience collaboration
        </Text>
        <SectionHeader
          level={2}
          heading={<span id="audience-heading">Built for research teams</span>}
          subheading="Laboratory, computational and reporting support for organisations that need reproducible outputs and clear communication."
          className="mt-2 text-center"
        />
        <ul className="mt-12 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3">
          {HOMEPAGE_AUDIENCES.map((audience) => (
            <li
              key={audience.title}
              className="flex flex-col gap-4 rounded-lg bg-surface-subtle p-7 ring-1 ring-border"
            >
              <IconDisc tone="accent">
                <Icon icon={audience.icon} size="lg" />
              </IconDisc>
              <Heading level={3} size="h4">
                {audience.title}
              </Heading>
              <Text tone="muted">{audience.description}</Text>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-body-sm text-copy">
                {audience.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
