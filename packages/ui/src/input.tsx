import { controlClasses, useFieldContext } from './field.tsx';

import type { ComponentPropsWithoutRef } from 'react';

/**
 * Text inputs, textareas, and selects.
 *
 * All three take their id, description, and invalid state from the surrounding `Field` rather than
 * from props, so a call site cannot render one without a label. The three share
 * `controlClasses` for the same reason: three near-identical class lists is how a focus ring ends
 * up missing from exactly one of them.
 */

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'aria-invalid'> {
  readonly className?: string;
}

export function Input({ className, type = 'text', ...rest }: InputProps) {
  const { controlId, describedBy, hasError, required } = useFieldContext('Input');

  return (
    <input
      id={controlId}
      type={type}
      className={controlClasses(hasError, className)}
      aria-describedby={describedBy}
      // `aria-invalid` is derived from whether an error exists, never passed in. Two sources of
      // truth for "is this field wrong" is how a field ends up announced as invalid with no
      // message, or with a message but announced as valid.
      aria-invalid={hasError || undefined}
      required={required || undefined}
      {...rest}
    />
  );
}

export interface TextareaProps extends Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'id' | 'aria-invalid'
> {
  readonly className?: string;
}

export function Textarea({ className, rows = 5, ...rest }: TextareaProps) {
  const { controlId, describedBy, hasError, required } = useFieldContext('Textarea');

  return (
    <textarea
      id={controlId}
      rows={rows}
      // Vertical resize only. Horizontal resizing lets the user drag the control wider than its
      // container, which breaks the layout and cannot be undone without reloading.
      className={controlClasses(hasError, `resize-y ${className ?? ''}`)}
      aria-describedby={describedBy}
      aria-invalid={hasError || undefined}
      required={required || undefined}
      {...rest}
    />
  );
}

export interface SelectProps extends Omit<
  ComponentPropsWithoutRef<'select'>,
  'id' | 'aria-invalid'
> {
  readonly className?: string;
}

/**
 * A native `<select>`.
 *
 * Native on purpose. A custom listbox has to reimplement type-ahead, keyboard paging, the mobile
 * wheel picker, and the way an OS renders an open dropdown over the viewport edge - and the
 * reimplementation is where combobox accessibility bugs come from. The design in the reference has
 * no requirement a native select cannot meet.
 */
export function Select({ className, children, ...rest }: SelectProps) {
  const { controlId, describedBy, hasError, required } = useFieldContext('Select');

  return (
    <select
      id={controlId}
      className={controlClasses(hasError, className)}
      aria-describedby={describedBy}
      aria-invalid={hasError || undefined}
      required={required || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
