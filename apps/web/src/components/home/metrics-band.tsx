import { Heading, Text } from '@cera/ui/typography';

import type { MetricHighlight } from '../../content/homepage.ts';

/**
 * Qualitative proof points — counts drawn from the published service catalogue and process, not marketing claims.
 * Override via CMS `statistics` block on the home page when present.
 */
export function MetricsBand({
  metrics,
}: {
  readonly metrics?: readonly MetricHighlight[] | undefined;
}) {
  const items = metrics ?? [];
  if (items.length === 0) return null;
  return (
    <section aria-label="CERA at a glance" className="border-b border-border bg-surface">
      <div className="mx-auto max-w-site px-6 py-10 md:px-10">
        <ul className="grid list-none grid-cols-2 gap-y-8 p-0 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {items.map((metric) => (
            <li key={metric.label} className="text-center lg:px-6 lg:text-left">
              <Heading level={3} size="h2" className="text-primary tabular-nums">
                {metric.value}
              </Heading>
              <Text as="p" size="body-sm" tone="muted" className="mt-1 font-semibold text-copy">
                {metric.label}
              </Text>
              {metric.detail ? (
                <Text as="p" size="caption" tone="muted" className="mt-0.5">
                  {metric.detail}
                </Text>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
