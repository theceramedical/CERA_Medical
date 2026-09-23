import { cn } from './cn.ts';

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

/**
 * The surface every card-shaped component is built on, per design-language.md section 5.2.
 *
 * Deliberately not clickable. The tempting shortcut is to wrap the whole card in an anchor, which
 * gives a large comfortable target - and produces an accessible name made of every word in the
 * card, announced as one enormous link, with any nested link now invalid markup. The design
 * contract instead makes the title the link, which is why this component has no `href` and no
 * `onClick`.
 */

export interface CardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'color'> {
  /**
   * The element to render.
   *
   * `li` when the card is one of a row - a list of services is a list, and saying so is what tells
   * a screen reader user how many there are before they start reading.
   */
  readonly as?: ElementType;
  /**
   * Whether the card responds to hover.
   *
   * Only ever a reinforcement. The hover lift is not an affordance on its own: the link inside the
   * card is what tells a keyboard or touch user that anything is actionable, because neither of
   * them can hover.
   */
  readonly interactive?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Card({
  as: Component = 'div',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Component
      className={cn(
        'flex flex-col rounded-lg border border-border bg-surface p-5 shadow-xs',
        interactive &&
          cn(
            'transition-[box-shadow,border-color] duration-base ease-standard',
            'hover:border-primary-200 hover:shadow-card-hover',
            /**
             * The hover treatment is mirrored on `:focus-within`, so moving focus to the card's
             * title link produces the same visual change as hovering it. Without this, a keyboard
             * user gets the focus ring on the link but no indication that the surrounding card is
             * the unit being acted on.
             */
            'focus-within:border-primary-200 focus-within:shadow-card-hover',
          ),
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Pushes whatever follows it to the bottom of a card.
 *
 * Cards in a row have unequal copy lengths, and a footer action that floats up to meet short copy
 * leaves a row of buttons at three different heights. This is a spacer rather than
 * `justify-between` on the card, because the latter also spreads the gaps between the title and the
 * description.
 */
export function CardSpacer() {
  return <div aria-hidden="true" className="grow" />;
}
