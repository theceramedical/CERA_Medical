import { Heading, Text } from '@cera/ui/typography';

import type { ReactNode } from 'react';

/**
 * The heading band on an interior page.
 *
 * Carries the page's single `h1`, which is why it takes a plain string rather than children: a
 * `ReactNode` here invites a call site to pass another heading, and two `h1`s is the most common
 * heading-outline defect there is.
 *
 * `SectionHeader` in `@cera/ui` is the centred `h2` treatment used between bands on the homepage.
 * This is the left-aligned page title, which is a different thing at a different level - keeping them
 * separate stops either drifting into a component with a `variant` prop that does both.
 */
export interface PageHeaderProps {
  readonly title: string;
  readonly lede?: string;
  /** Breadcrumbs, a button, anything belonging to the band rather than to the page body. */
  readonly children?: ReactNode;
}

export function PageHeader({ title, lede, children }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-surface-tint">
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {children}

        <Heading level={1} size="h1">
          {title}
        </Heading>

        {lede !== undefined && (
          // `measure` caps the line length. A lede running the full 1200px container is about 140
          // characters a line, which is roughly twice the point at which the eye stops reliably
          // finding the start of the next one.
          <Text size="body-lg" tone="muted" measure className="mt-4">
            {lede}
          </Text>
        )}
      </div>
    </div>
  );
}
