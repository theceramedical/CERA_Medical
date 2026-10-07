import { Breadcrumbs } from '@cera/ui/breadcrumbs';
import { Heading, Text } from '@cera/ui/typography';
import { Info } from 'lucide-react';

import type { Crumb } from '@cera/ui/breadcrumbs';

import { AppLink } from './link.tsx';

import type { ReactNode } from 'react';

export interface MarketingPageHeaderProps {
  readonly title: string;
  readonly lede?: string;
  readonly eyebrow?: string;
  readonly badges?: readonly string[];
  readonly notice?: { readonly title: string; readonly body: string };
  readonly breadcrumbs?: readonly Crumb[];
  readonly availability?: string | null;
  readonly children?: ReactNode;
}

/**
 * Stitch Clinical Precision page hero: breadcrumb bar, eyebrow pill, title, lede, badges, notice.
 */
export function MarketingPageHeader({
  title,
  lede,
  eyebrow,
  badges,
  notice,
  breadcrumbs,
  availability,
  children,
}: MarketingPageHeaderProps) {
  return (
    <>
      {breadcrumbs !== undefined && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="border-b border-border bg-surface">
          <div className="mx-auto max-w-site px-6 py-2.5 md:px-10">
            <Breadcrumbs items={breadcrumbs} linkAs={AppLink} />
          </div>
        </nav>
      ) : null}
      <div className="border-b border-border bg-linear-to-b from-surface-tint to-surface">
        <div className="mx-auto min-w-0 max-w-site px-4 py-8 sm:px-6 sm:py-10 md:px-10 lg:py-14">
          {children}
          {eyebrow ? (
            <Text
              as="p"
              size="eyebrow"
              tone="muted"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1"
            >
              {eyebrow}
            </Text>
          ) : null}
          <Heading level={1} size="h1" className={eyebrow ? 'mt-4' : undefined}>
            {title}
          </Heading>
          {lede ? (
            <Text size="body-lg" tone="muted" measure className="mt-4">
              {lede}
            </Text>
          ) : null}
          {availability ? (
            <Text
              size="body-sm"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-tint px-3 py-2 font-medium text-primary"
            >
              {availability}
            </Text>
          ) : null}
          {badges !== undefined && badges.length > 0 ? (
            <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
              {badges.map((label) => (
                <li
                  key={label}
                  className="rounded border border-border bg-surface px-2.5 py-1 text-caption text-muted"
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
          {notice ? (
            <div
              className="mt-6 flex gap-3 rounded-lg border border-border border-l-4 border-l-accent bg-surface p-4 shadow-card"
              role="note"
            >
              <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
              <div>
                <Text className="font-semibold text-heading">{notice.title}</Text>
                <Text size="body-sm" tone="muted" className="mt-1">
                  {notice.body}
                </Text>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
