import { ChevronRight } from 'lucide-react';

import { cn } from './cn.ts';
import { IconDisc } from './icon-disc.tsx';
import { Text } from './typography.tsx';

import type { ReactNode } from 'react';

/**
 * The "how it works" band, per design-language.md section 5.3.
 *
 * `<ol>` rather than a row of divs, because the order is the content. The consequence is the part
 * worth stating: since the list already conveys position, the big `01` / `02` / `03` ordinals are
 * **decorative** and are `aria-hidden`. Leaving them exposed makes a screen reader announce
 * "01 Explore, 1 of 3" - the number twice, in two different notations.
 *
 * `ProcessSteps` owns the list and the chevrons rather than each step rendering its own separator,
 * because only the container knows which step is last. A trailing chevron pointing at nothing is
 * the usual symptom of getting that wrong.
 */

export interface ProcessStepsProps {
  readonly className?: string;
  readonly children: ReactNode;
}

export function ProcessSteps({ className, children }: ProcessStepsProps) {
  return (
    <ol
      className={cn(
        'flex flex-col gap-8',
        // Horizontal from `lg`, which is also where the chevrons appear. Below that the steps stack
        // and the vertical order is the only ordering cue needed.
        'lg:flex-row lg:items-start lg:gap-4',
        className,
      )}
    >
      {children}
    </ol>
  );
}

export interface ProcessStepProps {
  /** Rendered as the two-digit ordinal, `aria-hidden`. The `<ol>` conveys the real order. */
  readonly ordinal: number;
  readonly title: string;
  readonly description: string;
  readonly icon?: ReactNode;
  /**
   * Whether a chevron follows this step.
   *
   * Set by the caller for every step but the last. Hidden below `lg`, where the steps stack and a
   * right-pointing chevron would point across the layout rather than along it.
   */
  readonly hasNext?: boolean;
  readonly headingLevel?: 2 | 3 | 4;
  readonly className?: string;
}

export function ProcessStep({
  ordinal,
  title,
  description,
  icon,
  hasNext = false,
  headingLevel = 3,
  className,
}: ProcessStepProps) {
  const HeadingTag = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <li className={cn('flex flex-1 items-start gap-4', className)}>
      <div className="flex flex-1 flex-col items-start gap-3">
        <div className="flex items-center gap-3">
          {/* `aria-hidden` for the reason at the top of the file. `tabular-nums` so 01 and 10 are
              the same width and the discs beside them stay aligned. */}
          <span aria-hidden="true" className="text-h3 font-bold tabular-nums text-primary">
            {String(ordinal).padStart(2, '0')}
          </span>

          {icon === undefined ? null : (
            <IconDisc tone="raised" size="lg">
              {icon}
            </IconDisc>
          )}
        </div>

        <HeadingTag className="text-h4">{title}</HeadingTag>

        <Text size="body-sm">{description}</Text>
      </div>

      {hasNext ? (
        <ChevronRight
          aria-hidden="true"
          // `neutral-300` per the reference. Decorative, so WCAG 1.4.11's 3:1 does not apply: the
          // `<ol>` carries the sequence, and removing the chevron loses nothing.
          className="mt-2 hidden size-6 shrink-0 text-neutral-300 lg:block"
        />
      ) : null}
    </li>
  );
}
