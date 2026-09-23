import { cn } from './cn.ts';
import { visuallyHiddenUntilFocusClasses } from './visually-hidden.tsx';

import type { ReactNode } from 'react';

/**
 * "Skip to content", per design-language.md section 5.5.
 *
 * WCAG 2.2 SC 2.4.1 Bypass Blocks. Without it, every keyboard user pays the header's full nav -
 * wordmark, five links, search, two buttons - on every page before reaching anything they came for.
 *
 * Three details are what make it actually work, as opposed to merely exist:
 *
 *   - It must be the **first focusable element in the document**, which means first in DOM order in
 *     the layout, before the header. Placing it after the header visually and reordering with CSS
 *     does not change tab order.
 *   - It must become **visible** on focus. `VisuallyHidden` alone leaves a keyboard user tabbing to
 *     something they cannot see, which reads as focus disappearing.
 *   - Its target needs `tabindex="-1"`, otherwise following the link scrolls the page but leaves
 *     focus on the link, and the next Tab continues through the header anyway. `MainContent` below
 *     is the matching half, which is why both are in this file.
 */

export interface SkipLinkProps {
  /** The id of the main landmark, without the `#`. */
  readonly targetId?: string;
  readonly className?: string;
  readonly children?: string;
}

export function SkipLink({
  targetId = 'main-content',
  className,
  children = 'Skip to content',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        visuallyHiddenUntilFocusClasses,
        // When focused it becomes a real button-shaped control at the top-left of the viewport.
        // `focus-visible:fixed` overrides the recipe's `static`, so it floats over the header
        // rather than pushing it down and shifting the whole page by its height.
        'focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50',
        'focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-3',
        'focus-visible:text-button focus-visible:text-on-primary focus-visible:shadow-lg',
        className,
      )}
    >
      {children}
    </a>
  );
}

export interface MainContentProps {
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * The skip link's destination.
 *
 * `tabindex="-1"` makes the element programmatically focusable so the browser moves focus here on
 * activation. Without it the link is a scroll and nothing more.
 */
export function MainContent({ id = 'main-content', className, children }: MainContentProps) {
  return (
    <main
      id={id}
      tabIndex={-1}
      // The default focus ring is suppressed on this element specifically. It is focused as a side
      // effect of following the skip link, not because the user is interacting with it, and a
      // 2px ring around the entire page body is alarming rather than informative. The heading
      // inside is what tells the user where they landed.
      className={cn('focus-visible:outline-none', className)}
    >
      {children}
    </main>
  );
}
