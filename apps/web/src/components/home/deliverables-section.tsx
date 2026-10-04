import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Cloud, FileText, FolderClosed, MessageSquare } from 'lucide-react';

import { HOMEPAGE_DELIVERABLES } from '../../content/homepage.ts';

import type { LucideIcon } from 'lucide-react';

const ICONS: readonly LucideIcon[] = [FileText, FolderClosed, Cloud, MessageSquare];

export function DeliverablesSection({
  eyebrow = 'Transparent specifications',
  heading = 'What You Receive',
  subheading = 'Deliverables are agreed in writing during scoping so everyone knows what “done” looks like before work starts.',
  items,
}: {
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly items?: readonly { title: string; description: string }[];
}) {
  const cards = items !== undefined && items.length > 0 ? items : HOMEPAGE_DELIVERABLES;

  return (
    <section
      aria-labelledby="deliverables-heading"
      className="border-b border-border bg-surface py-16"
    >
      <div className="mx-auto max-w-site px-6 md:px-10">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Text
            as="p"
            size="eyebrow"
            className="font-semibold tracking-widest text-accent uppercase"
          >
            {eyebrow}
          </Text>
          <Heading level={2} size="h2" id="deliverables-heading" className="mt-1 mb-3">
            {heading}
          </Heading>
          <Text tone="muted">{subheading}</Text>
        </div>
        <ol className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((item, index) => {
            const n = String(index + 1).padStart(2, '0');
            const StepIcon = ICONS[index] ?? FileText;
            return (
              <li
                key={item.title}
                className="relative rounded-lg border border-border bg-surface p-6"
              >
                <span className="absolute top-4 right-4 font-wordmark text-h3 font-bold text-accent/30">
                  {n}
                </span>
                <div className="mb-4 flex size-8 items-center justify-center rounded-lg bg-surface-tint text-primary">
                  <Icon icon={StepIcon} size="sm" />
                </div>
                <Heading level={3} size="h4" className="mb-2">
                  {item.title}
                </Heading>
                <Text size="caption" tone="muted">
                  {item.description}
                </Text>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
