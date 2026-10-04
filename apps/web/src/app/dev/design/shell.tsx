import { cn } from '@cera/ui/cn';
import { Heading, Text } from '@cera/ui/typography';

import type { ReactNode } from 'react';

/**
 * Layout for the preview page.
 *
 * The page is itself a test subject: axe and the keyboard walk in WP-03.8 run against it, so its
 * own structure has to be correct or every run reports failures that belong to the harness rather
 * than to the design system. That means one `h1`, `h2` per section, `h3` per example, and no
 * heading level skipped - which is why the level is fixed by the component instead of being passed
 * in per call site.
 */

export function PreviewSection({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      id={id}
      className="scroll-mt-8 border-t border-border pt-10"
    >
      <Heading level={2} size="h3" id={`${id}-heading`}>
        {title}
      </Heading>
      {description !== undefined && (
        <Text tone="muted" measure className="mt-2">
          {description}
        </Text>
      )}
      <div className="mt-6 flex min-w-0 flex-col gap-8">{children}</div>
    </section>
  );
}

/**
 * One named example within a section.
 *
 * The name is a heading rather than a styled `div`, so the page is navigable by heading in a screen
 * reader. A preview page is exactly the kind of long, flat document where heading navigation is the
 * only practical way to move, and a list of sixty unlabelled boxes is unusable.
 */
export function PreviewCase({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="min-w-0 flex w-full max-w-full flex-col gap-3">
      <Heading level={3} size="h4">
        {title}
      </Heading>
      {note !== undefined && (
        <Text size="caption" tone="muted" measure>
          {note}
        </Text>
      )}
      {children}
    </div>
  );
}

/**
 * A neutral frame to place examples on.
 *
 * `bg-surface` by default rather than transparent, because several components are white-on-white by
 * design and disappear against an unset background - which reads as a broken component rather than
 * as a missing frame.
 */
export function PreviewStage({
  children,
  className,
  label,
}: {
  readonly children: ReactNode;
  // `| undefined` rather than bare optional: `exactOptionalPropertyTypes` is on, so a caller
  // passing a conditional `className={x ? 'a' : undefined}` would otherwise be a type error.
  readonly className?: string | undefined;
  /** Describes a non-default backdrop, so a reader knows the example is not on white. */
  readonly label?: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-2">
      {label !== undefined && (
        <Text size="caption" tone="muted">
          {label}
        </Text>
      )}
      <div className={cn('rounded-lg border border-border bg-surface p-6', className)}>
        {children}
      </div>
    </div>
  );
}

/** A row of related examples that wraps rather than scrolling horizontally, for the reflow check. */
export function PreviewRow({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-4">{children}</div>;
}
