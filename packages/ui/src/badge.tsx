import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './cn.ts';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { ReactNode } from 'react';

/**
 * Badge and Pill, per design-language.md section 5.11 and 5.4.
 *
 * The rule both enforce: the label is always real text. WCAG 2.2 SC 1.4.1 forbids colour as the
 * only carrier of meaning, and a status shown as a coloured dot or a tinted chip with no word is
 * exactly that - invisible to a screen reader, ambiguous to a colour-blind user, and meaningless
 * in forced-colours mode where the tint is discarded outright. Neither component accepts an
 * icon-only or colour-only form, which is why `children` is required on both.
 */

const badgeVariants = cva(
  cn(
    'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5',
    'text-caption font-semibold whitespace-nowrap',
  ),
  {
    variants: {
      /**
       * The tint carries no information the text does not already carry. It is redundant on
       * purpose: redundant encoding is what makes the component survive being desaturated,
       * printed, or rendered in a forced palette.
       */
      tone: {
        neutral: 'border-border-strong bg-surface-subtle text-copy',
        info: 'border-primary-200 bg-primary-50 text-primary-800',
        success: 'border-success-500/30 bg-success-50 text-success-700',
        warning: 'border-warning-500/30 bg-warning-50 text-warning-700',
        danger: 'border-danger-500/30 bg-danger-50 text-danger-700',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  /**
   * What the badge means, spelled out for assistive technology.
   *
   * "Under review" on its own does not say what is under review or that it is a status at all. A
   * prefix such as "Enquiry status" is rendered visually hidden ahead of the label so the
   * announcement is a complete statement.
   */
  readonly srPrefix?: string;
  // `| undefined` explicitly, because `exactOptionalPropertyTypes` is on: without it a caller
  // forwarding its own optional `className` straight through is a type error.
  readonly className?: string | undefined;
  /** Required. A badge with no text is a coloured shape, which SC 1.4.1 does not permit. */
  readonly children: ReactNode;
}

export function Badge({ tone, srPrefix, className, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {srPrefix === undefined ? null : <VisuallyHidden>{`${srPrefix}: `}</VisuallyHidden>}
      {children}
    </span>
  );
}

/**
 * The category chip over an article's cover image, per design-language.md section 5.4.
 *
 * A `<span>`, not a link. The reference draws it as a tinted rounded rectangle sitting on the
 * image, which reads as a filter control - but making it one would put two links inside a card
 * whose title is already the link, and the category is reachable from the article page anyway.
 *
 * `teal-700` fill rather than the sampled `teal-600`: white on teal-600 measures 3.42:1, and this
 * label is 11px. See design-language.md section 1.4.
 */
export interface PillProps {
  readonly className?: string;
  readonly children: ReactNode;
}

export function Pill({ className, children }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm bg-accent-fill px-2 py-1',
        'text-pill uppercase text-on-accent',
        className,
      )}
    >
      {/* Without this the announcement is a bare word - "Wellness" - dropped between the cover
          image and the title, with nothing to say what it refers to. */}
      <VisuallyHidden>Category: </VisuallyHidden>
      {children}
    </span>
  );
}

export { badgeVariants };
