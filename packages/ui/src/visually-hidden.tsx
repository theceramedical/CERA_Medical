import { cn } from './cn.ts';

import type { ComponentPropsWithoutRef, ElementType } from 'react';

/**
 * Content available to assistive technology but not painted.
 *
 * The class list is the well-established clip-rect recipe rather than anything simpler, and
 * every part of it is load-bearing:
 *
 *   - `display: none` and `visibility: hidden` are **not** options. Both remove the element from
 *     the accessibility tree, which is the opposite of the intent.
 *   - `absolute` with `h-px w-px overflow-hidden` shrinks the box without collapsing it. A
 *     zero-size element is skipped by some screen readers, so 1px is the floor.
 *   - `clip-path: inset(50%)` hides the remaining pixel. `clip` alone is deprecated; both are
 *     present because coverage differs between engines.
 *   - `whitespace-nowrap` stops a long string wrapping inside a 1px box, which in some engines
 *     produces a tall invisible column that still affects scroll height.
 *   - `-m-px` keeps that pixel from contributing to layout.
 *
 * Used for the things design-language.md section 5 requires but does not draw: the "Category:"
 * prefix on an article pill, the accessible name of an icon-only social button, and the second
 * link on a service card.
 */

const VISUALLY_HIDDEN =
  'absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)] [clip-path:inset(50%)]';

export interface VisuallyHiddenProps extends ComponentPropsWithoutRef<'span'> {
  /**
   * Renders as something other than a `span`.
   *
   * Occasionally necessary: a visually hidden `<h2>` still contributes to the document outline,
   * which is how a landmark region gets a name without a visible heading.
   */
  readonly as?: ElementType;
}

export function VisuallyHidden({ as = 'span', className, ...rest }: VisuallyHiddenProps) {
  const Tag = as;

  return <Tag className={cn(VISUALLY_HIDDEN, className)} {...rest} />;
}

/** The same class list, for the rare case where a wrapper element is not wanted. */
export const visuallyHiddenClasses = VISUALLY_HIDDEN;

/**
 * Hidden until focused, then shown.
 *
 * The skip link, and nothing else so far. It has to be the first focusable element in the
 * document and invisible until a keyboard user reaches it, so it cannot use `VisuallyHidden` -
 * that would keep it hidden while focused, leaving a keyboard user tabbing to something they
 * cannot see.
 */
export const visuallyHiddenUntilFocusClasses = cn(
  VISUALLY_HIDDEN,
  'focus-visible:static focus-visible:m-0 focus-visible:h-auto focus-visible:w-auto',
  'focus-visible:overflow-visible focus-visible:whitespace-normal',
  'focus-visible:[clip:auto] focus-visible:[clip-path:none]',
);
