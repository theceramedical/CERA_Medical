import { cn } from './cn.ts';
import { IconDisc } from './icon-disc.tsx';

import type { ReactNode } from 'react';

/**
 * "Nothing here", per design-language.md section 5.11: icon disc, `h3`, `body` explanation, one
 * action.
 *
 * `description` and `heading` are both required, and the reason is that the two failure modes of an
 * empty state are opposite. "No results" alone tells the user nothing about what to do next. A
 * paragraph with no heading is missed entirely by someone scanning by heading. Requiring both is
 * cheaper than a convention nobody remembers.
 *
 * `headingLevel` is a prop rather than a fixed `h3`, because an empty state's correct level depends
 * on where it appears - inside a section that already has an `h2`, or as the whole page body. A
 * hardcoded level produces a skipped heading in one of those cases, and heading order is one of the
 * things the axe baseline in WP-03.8 checks.
 */

export interface EmptyStateProps {
  /** A 24px line icon. Wrapped in an `aria-hidden` disc, so it is never the message. */
  readonly icon?: ReactNode;
  readonly heading: string;
  readonly description: string;
  /** Exactly one action, per the design contract. A choice of three is not an empty state. */
  readonly action?: ReactNode;
  readonly headingLevel?: 2 | 3 | 4;
  readonly className?: string;
}

export function EmptyState({
  icon,
  heading,
  description,
  action,
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      {icon === undefined ? null : (
        <IconDisc tone="accent" size="lg">
          {icon}
        </IconDisc>
      )}

      <div className="flex max-w-measure flex-col gap-2">
        <Heading className="text-h3">{heading}</Heading>
        <p className="text-body text-copy">{description}</p>
      </div>

      {action}
    </div>
  );
}
