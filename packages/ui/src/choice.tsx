'use client';

import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import { cn } from './cn.ts';

/**
 * Checkbox and radio group.
 *
 * Client components, for the same reason as `Field`: `useId` is the only id generator that produces
 * the same value on the server and after hydration, and a checkbox whose label points at the wrong
 * id is unlabelled in the only way that matters.
 *
 * These do not use `Field`, and the reason is structural rather than stylistic. `Field` puts the
 * label above the control, which is right for a text input. A checkbox's label belongs beside it,
 * and a radio group needs two levels of labelling - a question for the group and a label per
 * option - which a single `<label>` cannot express. Forcing them through `Field` would produce a
 * group whose question is not associated with the options at all.
 */

const CHOICE_CONTROL = cn(
  // 20px, with the 44px touch target coming from the padded label wrapper rather than from the box
  // itself - a 44px checkbox glyph looks wrong, but a 44px clickable row does not.
  'size-5 shrink-0 border border-border-control bg-surface',
  'transition-colors duration-fast ease-standard',

  /**
   * `accent-color` rather than a hand-built replacement.
   *
   * The usual approach is `appearance: none` plus a custom tick, which then has to reimplement the
   * indeterminate state, the disabled state, the focus ring, and forced-colours rendering - and
   * the reimplementation is where these controls stop working in Windows high contrast mode. Using
   * the native widget and recolouring it keeps all of that.
   */
  'accent-primary',

  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

/** The clickable row around a choice control, which is what provides the 44px target. */
const CHOICE_ROW = 'flex min-h-11 cursor-pointer items-start gap-3 py-2';

export interface CheckboxProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'id' | 'aria-invalid'
> {
  /** Beside the box, not above it. Always present - a checkbox with no visible label is unusable. */
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly className?: string;
}

/**
 * A single checkbox.
 *
 * The consent checkbox on the enquiry form is the important instance (PRD ENQ-401), which is why
 * the label is a required prop rather than optional: consent that is not clearly described is not
 * consent.
 */
export function Checkbox({ label, hint, error, className, required, ...rest }: CheckboxProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = error !== undefined && error !== null && error !== false;

  const describedBy =
    [hasError ? errorId : undefined, hint !== undefined ? hintId : undefined]
      .filter((value): value is string => value !== undefined)
      .join(' ') || undefined;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* The whole row is the label, so clicking the text toggles the box. Wrapping rather than
          using `htmlFor` alone, because the wrapper is also what gives the row its 44px height. */}
      <label htmlFor={id} className={CHOICE_ROW}>
        <input
          id={id}
          type="checkbox"
          // `mt-0.5` aligns the box with the first line's cap height rather than its box top, which
          // otherwise sits visibly high against a two-line label.
          className={cn(CHOICE_CONTROL, 'mt-0.5 rounded-sm')}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          required={required}
          {...rest}
        />
        <span className="text-body-sm text-copy">
          {label}
          {required === true ? <span className="ml-1 text-muted">(required)</span> : null}
        </span>
      </label>

      {hint !== undefined ? (
        // Indented to the label's text column, so it reads as belonging to the option.
        <p id={hintId} className="ml-8 text-caption text-muted">
          {hint}
        </p>
      ) : null}

      {hasError ? (
        <p id={errorId} role="alert" className="ml-8 text-caption text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface RadioGroupContextValue {
  readonly name: string;
  readonly value: string | undefined;
  readonly onChange: ((value: string) => void) | undefined;
  readonly hasError: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  /** The question. Rendered as the `<legend>`, which is what associates it with every option. */
  readonly legend: ReactNode;
  readonly name: string;
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly required?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * A set of mutually exclusive options.
 *
 * `<fieldset>` and `<legend>`, not a `div` with a heading. The pairing is the only markup that
 * makes a screen reader announce the question when focus lands on an option - so the user hears
 * "Preferred contact method, Email, radio button 1 of 3" rather than just "Email". A visual
 * heading above a group of radios looks identical and conveys none of that.
 */
export function RadioGroup({
  legend,
  name,
  value,
  onChange,
  hint,
  error,
  required = false,
  className,
  children,
}: RadioGroupProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = error !== undefined && error !== null && error !== false;

  const describedBy =
    [hasError ? errorId : undefined, hint !== undefined ? hintId : undefined]
      .filter((entry): entry is string => entry !== undefined)
      .join(' ') || undefined;

  return (
    <RadioGroupContext.Provider value={{ name, value, onChange, hasError }}>
      <fieldset
        className={cn('flex flex-col gap-1', className)}
        aria-describedby={describedBy}
        aria-invalid={hasError || undefined}
        aria-required={required || undefined}
      >
        <legend className="mb-1 text-body-sm font-semibold text-foreground">
          {legend}
          {required ? <span className="ml-1 font-normal text-muted">(required)</span> : null}
        </legend>

        {hint !== undefined ? (
          <p id={hintId} className="mb-1 text-caption text-muted">
            {hint}
          </p>
        ) : null}

        {children}

        {hasError ? (
          <p id={errorId} role="alert" className="text-caption text-danger-700">
            {error}
          </p>
        ) : null}
      </fieldset>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'id' | 'name' | 'value' | 'onChange'
> {
  readonly label: ReactNode;
  readonly value: string;
  readonly className?: string;
}

export function Radio({ label, value, className, ...rest }: RadioProps) {
  const context = useContext(RadioGroupContext);
  const id = useId();

  if (context === null) {
    throw new Error(
      'Radio must be rendered inside <RadioGroup>. The group supplies the shared name, which is ' +
        'what makes the options mutually exclusive, and the legend that names the question.',
    );
  }

  return (
    <label htmlFor={id} className={cn(CHOICE_ROW, className)}>
      <input
        id={id}
        type="radio"
        name={context.name}
        value={value}
        checked={context.value === undefined ? undefined : context.value === value}
        onChange={
          context.onChange === undefined
            ? undefined
            : () => {
                context.onChange?.(value);
              }
        }
        className={cn(CHOICE_CONTROL, 'mt-0.5 rounded-full')}
        {...rest}
      />
      <span className="text-body-sm text-copy">{label}</span>
    </label>
  );
}
