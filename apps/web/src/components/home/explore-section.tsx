import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { Building2, GitBranch, MessagesSquare } from 'lucide-react';
import NextLink from 'next/link';

import { HOMEPAGE_EXPLORE } from '../../content/homepage.ts';

import type { LucideIcon } from 'lucide-react';

const ICONS: readonly LucideIcon[] = [GitBranch, Building2, MessagesSquare];

export function ExploreSection({
  items,
}: {
  readonly items?: readonly {
    title: string;
    description: string;
    href: string;
    linkLabel?: string;
  }[];
}) {
  const cards =
    items !== undefined && items.length > 0
      ? items.map((item, index) => ({
          ...item,
          icon: HOMEPAGE_EXPLORE[index]?.icon ?? ICONS[index] ?? GitBranch,
          footer: item.linkLabel ?? HOMEPAGE_EXPLORE[index]?.title ?? 'Learn more',
        }))
      : HOMEPAGE_EXPLORE.map((item) => ({
          ...item,
          footer:
            item.href === '/methodology'
              ? 'Read methodology'
              : item.href === '/about'
                ? 'Institutional overview'
                : 'Direct contact details',
        }));

  return (
    <section aria-label="Explore CERA Medical" className="border-b border-border bg-surface py-12">
      <div className="mx-auto max-w-site px-6 md:px-10">
        <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {cards.map((link) => (
            <li key={link.href}>
              <NextLink
                href={link.href}
                className="group flex h-full flex-col justify-between rounded-lg border border-border p-6 no-underline transition-colors hover:border-accent hover:bg-surface-tint"
              >
                <div>
                  <Icon icon={link.icon} size="lg" className="mb-2 text-accent" />
                  <Heading level={2} size="h4" className="mb-1">
                    {link.title}
                  </Heading>
                  <Text size="caption" tone="muted">
                    {link.description}
                  </Text>
                </div>
                <div className="mt-4 text-caption font-semibold text-accent">{link.footer} →</div>
              </NextLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
