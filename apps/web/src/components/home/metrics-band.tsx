import { Text } from '@cera/ui/typography';

import { HOMEPAGE_METRICS, type MetricHighlight } from '../../content/homepage.ts';

export function MetricsBand({
  metrics,
}: {
  readonly metrics?: readonly MetricHighlight[] | undefined;
}) {
  const items = metrics !== undefined && metrics.length > 0 ? metrics : HOMEPAGE_METRICS;
  return (
    <section aria-label="CERA at a glance" className="border-b border-border bg-surface py-12">
      <div className="mx-auto max-w-site px-6 md:px-10">
        <ul className="grid list-none grid-cols-2 divide-y divide-border p-0 sm:divide-y-0 sm:divide-x md:grid-cols-4">
          {items.map((metric) => (
            <li
              key={metric.label}
              className="flex flex-col items-center pt-4 sm:items-start sm:px-6 sm:pt-0"
            >
              <span className="mb-1 font-wordmark text-h1 leading-none font-bold text-primary">
                {metric.value}
              </span>
              <Text as="p" size="body-sm" className="font-semibold text-muted">
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
