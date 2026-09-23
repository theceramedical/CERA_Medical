import { cn } from './cn.ts';
import { SectionRule } from './divider.tsx';
import { Text } from './typography.tsx';

import type { ReactNode } from 'react';

/**
 * The centred heading block above each homepage band, per design-language.md section 5.7.
 *
 * `level` is a required prop with no default. Every other composite in this package defaults to
 * `h3`, and this one does not, because a section header is the thing that establishes the level for
 * everything under it - so a wrong default here cascades. Making it explicit costs one prop per call
 * site and removes the most common source of the "heading levels should only increase by one" axe
 * failure.
 *
 * The teal rule above the heading is `aria-hidden` (see `SectionRule`): it announces "a heading
 * follows", which the heading already does.
 */

export interface SectionHeaderProps {
  readonly level: 1 | 2 | 3;
  readonly heading: ReactNode;
  /** Capped at 65ch by the `measure` token. Beyond that a centred line is hard to track back. */
  readonly subheading?: ReactNode;
  /**
   * An optional "View all" link, right-aligned on the heading's baseline from `lg` and stacked
   * beneath the sub-heading below that.
   */
  readonly action?: ReactNode;
  readonly className?: string;
}

export function SectionHeader({
  level,
  heading,
  subheading,
  action,
  className,
}: SectionHeaderProps) {
  const HeadingTag = `h${String(level)}` as 'h1' | 'h2' | 'h3';
  const size = level === 1 ? 'text-h1' : 'text-h2';

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 text-center',
        // From `lg` the action sits on the heading's row, so the block becomes a three-part layout
        // with the copy centred and the action pushed right.
        action === undefined ? '' : 'lg:flex-row lg:items-end lg:justify-between lg:text-left',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4 lg:items-start">
        <SectionRule />

        <HeadingTag className={size}>{heading}</HeadingTag>

        {subheading === undefined ? null : (
          <Text size="body-lg" tone="muted" measure>
            {subheading}
          </Text>
        )}
      </div>

      {action}
    </div>
  );
}
