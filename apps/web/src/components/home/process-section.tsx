import { Icon } from '@cera/ui/icon';
import { ProcessStep, ProcessSteps } from '@cera/ui/process-step';
import { SectionHeader } from '@cera/ui/section-header';

import { HOMEPAGE_PROCESS } from '../../content/homepage.ts';

/**
 * Five-stage project workflow supplied by CERA, on the `surface-tint-2` band.
 *
 * Three steps in an `<ol>`, which `ProcessSteps` renders. The ordering is in the markup, so the visible
 * `01` / `02` / `03` is `aria-hidden` - otherwise a screen reader announces "01 Explore, 1 of 3", which
 * is the same information said twice with the numbers disagreeing about where they start.
 */
export function ProcessSection() {
  return (
    <section aria-labelledby="process-heading" className="bg-surface-tint-2">
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <SectionHeader
          level={2}
          heading={<span id="process-heading">How CERA Works</span>}
          subheading="A consistent workflow from first conversation to delivered results, with quality checks at each stage."
        />

        <ProcessSteps className="mt-12">
          {HOMEPAGE_PROCESS.map((step, index) => (
            <ProcessStep
              key={step.title}
              ordinal={index + 1}
              title={step.title}
              description={step.description}
              icon={<Icon icon={step.icon} size="lg" />}
              /**
               * A chevron after every step but the last.
               *
               * Computed rather than hard-coded, so adding a fourth step does not leave a chevron
               * pointing at nothing. The chevrons are removed below `lg` rather than rotated: once the
               * row stacks, a right-pointing arrow points across the layout instead of along it.
               */
              hasNext={index < HOMEPAGE_PROCESS.length - 1}
              headingLevel={3}
            />
          ))}
        </ProcessSteps>
      </div>
    </section>
  );
}
