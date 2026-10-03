import { Heading, Text } from '@cera/ui/typography';

import { HOMEPAGE_METRICS } from '../../content/homepage.ts';

/**
 * Qualitative proof points — counts drawn from the published service catalogue and process, not marketing claims.
 */
export function MetricsBand() {
  return (
    <section aria-label="CERA at a glance" className="bg-surface-tint-2">
      <div className="mx-auto max-w-site px-6 py-10 md:px-10">
        <ul className="grid list-none grid-cols-2 gap-6 p-0 lg:grid-cols-4">
          {HOMEPAGE_METRICS.map((metric) => (
            <li key={metric.label} className="text-center lg:text-left">
              <Heading level={3} size="h2" className="text-primary tabular-nums">
                {metric.value}
              </Heading>
              <Text as="p" size="body-sm" tone="muted" className="mt-1">
                {metric.label}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
