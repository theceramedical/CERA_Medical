import { cn } from './cn.ts';
import { Text } from './typography.tsx';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { ReactNode } from 'react';

/**
 * An enquiry's history, oldest first.
 *
 * `<ol>`, because the sequence is the content - the same reason as `ProcessSteps`. A timeline
 * rendered as divs reads as a pile of unrelated sentences, and a screen reader user gets no "3 of 5"
 * to tell them how much history there is.
 *
 * The date handling is where these components usually go wrong, so it is handled here once:
 *
 *   - Every entry renders a `<time datetime>` with the machine-readable ISO value alongside
 *     human-readable text. Without the attribute, "23 September" is just a string, and nothing -
 *     assistive technology, a browser extension, a crawler - can tell it is a date.
 *   - The visible text is formatted by the caller, not here. Formatting needs a locale and a time
 *     zone, and a component that reached for `toLocaleString()` with neither would silently render
 *     the server's zone during SSR and the user's on hydration - a date that changes after the page
 *     settles, and a React hydration mismatch.
 *   - A relative phrase ("2 days ago") is never the only form. It is unusable to anyone returning to
 *     the page later, and it cannot be read aloud precisely.
 */

export interface TimelineProps {
  readonly className?: string;
  readonly children: ReactNode;
}

export function Timeline({ className, children }: TimelineProps) {
  return <ol className={cn('flex flex-col', className)}>{children}</ol>;
}

export interface TimelineItemProps {
  /** A machine-readable ISO 8601 timestamp for the `datetime` attribute. */
  readonly dateTime: string;
  /** The same moment, formatted for reading. The caller owns locale and time zone. */
  readonly dateLabel: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Usually a `StatusBadge`. Rendered beside the title. */
  readonly marker?: ReactNode;
  /**
   * Whether this is the last entry.
   *
   * The connecting line is drawn per item, so only the caller knows where to stop it. A line
   * continuing past the final entry implies history that is not there.
   */
  readonly isLast?: boolean;
  readonly className?: string;
}

export function TimelineItem({
  dateTime,
  dateLabel,
  title,
  description,
  marker,
  isLast = false,
  className,
}: TimelineItemProps) {
  return (
    <li className={cn('flex gap-4', className)}>
      {/* The rail: a dot with a line beneath it. `aria-hidden` because it draws the sequence the
          `<ol>` already states. */}
      <div aria-hidden="true" className="flex flex-col items-center">
        <span className="mt-1.5 size-2.5 shrink-0 rounded-pill bg-primary" />
        {isLast ? null : <span className="w-px grow bg-border" />}
      </div>

      <div className={cn('flex flex-col gap-1', isLast ? 'pb-0' : 'pb-6')}>
        <div className="flex flex-wrap items-center gap-2">
          <Text as="span" size="body-sm" tone="heading" className="font-semibold">
            {title}
          </Text>
          {marker}
        </div>

        <Text as="span" size="caption" tone="muted">
          {/**
           * The whole announced phrase lives in one text node, and the painted `<time>` is hidden
           * from assistive technology.
           *
           * The obvious construction - a hidden "Updated " followed by the visible date - computes
           * to the name "Updated23 September 2026", because accessible-name computation trims each
           * node's text before concatenating it. `Pagination` had the same defect and it is the
           * kind that only a name assertion catches, since it reads correctly on screen.
           *
           * `aria-hidden` on the `<time>` costs nothing: the element's value is in its `datetime`
           * attribute, which is there for parsers and crawlers, and those do not honour
           * `aria-hidden`.
           */}
          <VisuallyHidden>{`Updated ${dateLabel}`}</VisuallyHidden>
          <time dateTime={dateTime} aria-hidden="true">
            {dateLabel}
          </time>
        </Text>

        {description === undefined ? null : (
          <Text size="body-sm" measure>
            {description}
          </Text>
        )}
      </div>
    </li>
  );
}
