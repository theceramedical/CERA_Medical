import { SectionHeader } from '@cera/ui/section-header';
import { Heading, Text } from '@cera/ui/typography';

import { HOMEPAGE_DELIVERABLES } from '../../content/homepage.ts';

export function DeliverablesSection() {
  return (
    <section aria-labelledby="deliverables-heading" className="bg-surface">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-20">
        <SectionHeader
          level={2}
          heading={<span id="deliverables-heading">What you receive</span>}
          subheading="Deliverables are agreed in writing during scoping so everyone knows what “done” looks like before work starts."
        />
        <ol className="mt-12 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2">
          {HOMEPAGE_DELIVERABLES.map((item, index) => (
            <li
              key={item.title}
              className="flex gap-5 rounded-lg border border-border bg-surface-subtle p-6 shadow-card"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-body-sm font-semibold tabular-nums"
              >
                {index + 1}
              </span>
              <div>
                <Heading level={3} size="h4">
                  {item.title}
                </Heading>
                <Text tone="muted" className="mt-2">
                  {item.description}
                </Text>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
