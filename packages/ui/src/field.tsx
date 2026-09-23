import { createContext, useContext, useId, type ReactNode } from 'react';

import { cn } from './cn.ts';

/**
 * The wiring that makes every control in this design system accessible by default.
 *
 * `Field` owns the ids and hands them to the control through context, which is the whole point.
 * The alternative - each call site writing `id`, `htmlFor`, `aria-describedby`, and `aria-invalid`
 * by hand - works until the day someone forgets one, and the failure is silent: the label still
 * looks attached because it sits directly above the input, and the error message is still visible
 * on screen. Only a screen reader user discovers that the input is unlabelled and that the error
 * is never read out.
 *
 * design-language.md section 5.10 is the contract, and PRD ENQ-402 is tested against it.
 */

interface FieldContextValue {
  readonly controlId: string;
  /** For `aria-describedby`. Undefined when there is nothing to describe, so no dangling id. */
  readonly describedBy: string | undefined;
  readonly hintId: string;
  readonly errorId: string;
  readonly hasError: boolean;
  readonly required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Returns the wiring for a control, or throws.
 *
 * Throwing rather than degrading to a plausible default. A control rendered outside `Field` has no
 * label, and the consequence of letting that render is an unlabelled input reaching production
 * looking perfectly normal. A crash during development is much cheaper.
 */
export function useFieldContext(componentName: string): FieldContextValue {
  const context = useContext(FieldContext);

  if (context === null) {
    throw new Error(
      `${componentName} must be rendered inside <Field>. Field supplies the label association ` +
        `and the aria-describedby wiring; without it the control has no accessible name.`,
    );
  }

  return context;
}

export interface FieldProps {
  /** Always visible. design-language.md section 5.10 forbids placeholder-only labelling. */
  readonly label: ReactNode;
  /** Helper text, rendered above the control so it is read before the input is reached. */
  readonly hint?: ReactNode;
  /** An error message. Its presence is what sets `aria-invalid` on the control. */
  readonly error?: ReactNode;
  readonly required?: boolean;
  /** Overrides the generated id. Needed when an error summary has to link to this control. */
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Field({
  label,
  hint,
  error,
  required = false,
  id,
  className,
  children,
}: FieldProps) {
  /**
   * `useId` rather than a counter or a random value.
   *
   * It produces the same id on the server and on the client, which is what stops React's hydration
   * from finding a mismatched `for`/`id` pair and silently discarding the association.
   */
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const hasError = error !== undefined && error !== null && error !== false;

  /**
   * Error first, then hint.
   *
   * Order is the announcement order. When a field is in error, the error is the useful part and
   * the hint is context, so a screen reader should reach the error first rather than after a
   * sentence of guidance the user has already read.
   *
   * `undefined` when there is nothing, rather than an empty string - an `aria-describedby`
   * pointing at ids that do not exist is ignored inconsistently across engines.
   */
  const describedBy =
    [hasError ? errorId : undefined, hint !== undefined ? hintId : undefined]
      .filter((value): value is string => value !== undefined)
      .join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ controlId, describedBy, hintId, errorId, hasError, required }}>
      <div className={cn('flex flex-col gap-2', className)}>
        <label htmlFor={controlId} className="text-body-sm font-semibold text-foreground">
          {label}
          {required ? (
            /**
             * "(required)" in words, not an asterisk.
             *
             * design-language.md section 5.10: required fields are marked in text, not by colour
             * or a symbol alone. An asterisk is a convention that has to be learned, is announced
             * as "star" or skipped entirely, and has no meaning to someone who has not seen the
             * legend - which is usually placed above the form where it has already scrolled away.
             */
            <span className="ml-1 font-normal text-muted">(required)</span>
          ) : null}
        </label>

        {hint !== undefined ? (
          <p id={hintId} className="text-caption text-muted">
            {hint}
          </p>
        ) : null}

        {children}

        {hasError ? (
          /**
           * `role="alert"` so the message is announced when it appears without the user having to
           * navigate to it. An error that is only discoverable by exploring the page is an error
           * the user does not know about.
           */
          <p id={errorId} role="alert" className="text-caption text-danger-700">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

/**
 * Shared control styling, from design-language.md section 5.10.
 *
 * Exported so `Input`, `Textarea`, and `Select` cannot drift apart. Three near-identical class
 * lists in three files is how a focus ring ends up missing from exactly one control.
 */
export function controlClasses(hasError: boolean, className?: string): string {
  return cn(
    // 44px minimum height, per the touch-target contract.
    'min-h-11 w-full rounded-md bg-surface px-3 py-2 text-body text-foreground',
    'border transition-colors duration-fast ease-standard',

    // `border-control` (neutral-500), not the sampled hairline: this border is the control
    // boundary, and WCAG 1.4.11 requires 3:1 for it. See design-language.md section 1.4.
    hasError ? 'border-danger-500' : 'border-border-control',

    // The placeholder is never the label, so it is styled as the secondary information it is.
    'placeholder:text-muted',

    /**
     * Focus keeps the border and adds the ring, rather than replacing one with the other.
     *
     * Swapping them is the common shortcut and it loses information: in forced-colours mode the
     * ring may be all that survives, and while an error is showing the red border is what tells
     * the user *which* field they are in.
     */
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',

    'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted',

    className,
  );
}
