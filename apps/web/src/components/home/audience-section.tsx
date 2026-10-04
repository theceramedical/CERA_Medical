import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Check, GraduationCap } from 'lucide-react';

import { HOMEPAGE_AUDIENCES } from '../../content/homepage.ts';

import type { LucideIcon } from 'lucide-react';

export interface AudienceCard {
  readonly title: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly footer?: string;
  readonly popular?: boolean;
  readonly icon?: LucideIcon;
}

const FOOTERS: Record<string, string> = {
  'Universities & institutes': 'View academic partnerships',
  'Biotech & industry R&D': 'Biotech enterprise agreements',
  'Health & public-sector research': 'Public health compliance details',
};

export function AudienceSection({
  eyebrow = 'Audience collaboration',
  heading = 'Built for Research Teams',
  subheading = 'Laboratory, computational and reporting support for organisations that need reproducible outputs and clear communication.',
  items,
}: {
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly items?: readonly AudienceCard[];
}) {
  const cards: readonly (AudienceCard & { icon: LucideIcon; popular: boolean; footer: string })[] =
    items !== undefined && items.length > 0
      ? items.map((item) => ({
          ...item,
          popular: item.popular === true || item.title.toLowerCase().includes('biotech'),
          footer: item.footer ?? FOOTERS[item.title] ?? item.title,
          icon: item.icon ?? GraduationCap,
        }))
      : HOMEPAGE_AUDIENCES.map((item, index) => ({
          ...item,
          popular: index === 1,
          footer: FOOTERS[item.title] ?? '',
          icon: item.icon,
        }));

  return (
    <section
      aria-labelledby="audience-heading"
      className="border-b border-border bg-surface-tint py-16"
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
          <Heading level={2} size="h2" id="audience-heading" className="mt-1 mb-3">
            {heading}
          </Heading>
          <Text tone="muted">{subheading}</Text>
        </div>
        <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {cards.map((audience) => {
            const DiscIcon = audience.icon;
            return (
              <li
                key={audience.title}
                className={`relative flex flex-col justify-between rounded-lg bg-surface p-6 shadow-card ${audience.popular ? 'border-2 border-accent/40' : 'border border-border'}`}
              >
                {audience.popular ? (
                  <span className="absolute -top-3 right-4 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-on-accent">
                    POPULAR
                  </span>
                ) : null}
                <div>
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-surface-tint text-primary">
                    <Icon icon={DiscIcon} size="md" />
                  </div>
                  <Heading level={3} size="h4" className="mb-2">
                    {audience.title}
                  </Heading>
                  <Text size="caption" tone="muted" className="mb-6">
                    {audience.description}
                  </Text>
                  <ul className="space-y-3 border-t border-border pt-4">
                    {audience.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-caption">
                        <Icon icon={Check} size="sm" className="mt-0.5 text-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {audience.footer ? (
                  <div
                    className={`mt-8 border-t border-border pt-4 text-caption font-semibold ${audience.popular ? 'text-accent' : 'text-primary'}`}
                  >
                    {audience.footer} →
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
