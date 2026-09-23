import { cva, type VariantProps } from 'class-variance-authority';
import { CircleCheckBig, CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react';

import { cn } from './cn.ts';

import type { ReactNode } from 'react';

/**
 * An in-page message, per design-language.md section 5.11.
 *
 * Distinct from `Toast` in one respect that governs the whole design: an alert is part of the
 * page. It stays where it is put, it can be long, and it can contain links - which is what the
 * enquiry form's error summary needs (design-language.md section 5.10: "focus moves to a summary at
 * the top of the form on submit failure, and the summary links to each field").
 *
 * The role is chosen by the caller through `tone`, and the mapping is not cosmetic:
 *
 *   - `danger` gets `role="alert"`, an assertive live region. It interrupts. That is right for "we
 *     could not submit your enquiry" and wrong for anything else, because an assertive region cuts
 *     off whatever the screen reader was mid-sentence on.
 *   - everything else gets `role="status"`, polite, which waits for a pause.
 *
 * `role` is not exposed as a prop. Letting a call site pass `role="alert"` on an informational
 * message is how a page ends up interrupting the user to tell them something they did not ask
 * about.
 */

const alertVariants = cva('flex gap-3 rounded-md border p-4', {
  variants: {
    tone: {
      info: 'border-primary-200 bg-primary-50 text-primary-900',
      success: 'border-success-500/30 bg-success-50 text-success-700',
      warning: 'border-warning-500/30 bg-warning-50 text-warning-700',
      danger: 'border-danger-500/30 bg-danger-50 text-danger-700',
    },
  },
  defaultVariants: { tone: 'info' },
});

type AlertTone = NonNullable<VariantProps<typeof alertVariants>['tone']>;

/**
 * An icon per tone, alongside the heading text.
 *
 * The icon is redundant with the wording and the colour, and that redundancy is the point: SC 1.4.1
 * means the tint cannot be the only thing distinguishing a warning from a confirmation, and the
 * shapes differ enough to be told apart when the colour is gone.
 */
const TONE_ICON: Record<AlertTone, LucideIcon> = {
  info: Info,
  success: CircleCheckBig,
  warning: TriangleAlert,
  danger: CircleX,
};

export interface AlertProps extends VariantProps<typeof alertVariants> {
  /**
   * A short summary line. Optional, because an error summary supplies its own heading element so
   * that focus can land on it.
   */
  readonly title?: ReactNode;
  readonly className?: string;
  readonly children?: ReactNode;
}

export function Alert({ tone = 'info', title, className, children }: AlertProps) {
  const Icon = TONE_ICON[tone ?? 'info'];

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(alertVariants({ tone }), className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />

      <div className="flex flex-col gap-1">
        {title === undefined ? null : <p className="text-body font-semibold">{title}</p>}
        {children === undefined ? null : <div className="text-body-sm">{children}</div>}
      </div>
    </div>
  );
}

export { alertVariants };
