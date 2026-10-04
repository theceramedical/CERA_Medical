import { Heading, Text } from '@cera/ui/typography';

import { HOMEPAGE_PROCESS } from '../../content/homepage.ts';

export function ProcessSection({
  eyebrow = 'Standardized timeline',
  heading = 'How CERA Works',
  subheading = 'A consistent workflow from first conversation to delivered results, with quality checks at each stage.',
  steps,
}: {
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly steps?: readonly { title: string; description: string }[];
}) {
  const items = steps !== undefined && steps.length > 0 ? steps : HOMEPAGE_PROCESS;
  const total = items.length;

  return (
    <section
      aria-labelledby="process-heading"
      className="border-b border-border bg-surface-tint py-16"
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
          <Heading level={2} size="h2" id="process-heading" className="mt-1 mb-2">
            {heading}
          </Heading>
          <Text tone="muted">{subheading}</Text>
        </div>
        <ol className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-5">
          {items.map((step, index) => {
            const n = String(index + 1).padStart(2, '0');
            return (
              <li
                key={step.title}
                className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5"
              >
                <div>
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-tint font-wordmark text-h4 font-bold text-primary shadow-sm">
                    {n}
                  </div>
                  <Heading level={3} size="h4" className="mb-2">
                    {step.title}
                  </Heading>
                  <Text size="caption" tone="muted">
                    {step.description}
                  </Text>
                </div>
                <div className="mt-4 border-t border-border pt-3 text-[11px] font-medium text-muted">
                  Stage {index + 1} of {total}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
