import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { FileCheck2, ClipboardCheck, Lock, MessagesSquare } from 'lucide-react';

import { HOMEPAGE_PRINCIPLES } from '../../content/homepage.ts';

import type { LucideIcon } from 'lucide-react';

const ICONS: readonly LucideIcon[] = [FileCheck2, ClipboardCheck, Lock, MessagesSquare];

export function PrinciplesSection({
  eyebrow = 'Ethical standards',
  heading = 'How We Work With Partners',
  subheading = 'Four foundational commitments behind every institutional research engagement.',
  items,
}: {
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly items?: readonly { title: string; description: string }[];
}) {
  const cards = items !== undefined && items.length > 0 ? items : HOMEPAGE_PRINCIPLES;

  return (
    <section
      aria-labelledby="principles-heading"
      className="border-b border-border bg-surface py-16"
    >
      <div className="mx-auto max-w-site px-6 md:px-10">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Text
            as="p"
            size="eyebrow"
            className="font-semibold tracking-widest text-accent uppercase"
          >
            {eyebrow}
          </Text>
          <Heading level={2} size="h2" id="principles-heading" className="mt-1 mb-2">
            {heading}
          </Heading>
          <Text tone="muted">{subheading}</Text>
        </div>
        <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((principle, index) => (
            <li
              key={principle.title}
              className="rounded-lg border border-border bg-surface-tint p-5"
            >
              <Icon icon={ICONS[index] ?? FileCheck2} size="lg" className="mb-2 text-accent" />
              <Heading level={3} size="h4" className="mb-1">
                {principle.title}
              </Heading>
              <Text size="caption" tone="muted">
                {principle.description}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
