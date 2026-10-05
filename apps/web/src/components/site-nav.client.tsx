'use client';

import { ButtonLink } from '@cera/ui/button';
import { cn } from '@cera/ui/cn';
import { FocusTrap } from '@cera/ui/focus-trap';
import { Icon } from '@cera/ui/icon';
import { Menu, X } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';

import { isCurrent } from './navigation.ts';

import type { NavItem } from './navigation.ts';

/**
 * The navigation below `lg`, as a disclosure (design-language.md section 5.5).
 *
 * A disclosure, not a dialog. The distinction is not pedantry: a dialog claims the page behind it is
 * unavailable, which obliges `aria-modal`, a labelled dialog role, and hiding the rest of the
 * document from assistive technology. A navigation panel is none of those things - it is a button that
 * shows and hides a list - and the disclosure pattern (`aria-expanded` plus `aria-controls`) says
 * exactly that with nothing to get wrong.
 *
 * It still traps focus while open, because the panel visually covers the page: without the trap, Tab
 * walks out of the visible panel and into content underneath it, and the focus ring disappears behind
 * an overlay. Escape closes it and focus returns to the trigger, both handled by `FocusTrap`.
 */
export function MobileNav({
  items,
  signedIn,
}: {
  readonly items: readonly NavItem[];
  readonly signedIn: boolean;
}) {
  const pathname = usePathname();

  /**
   * Open-ness is derived, not synchronised.
   *
   * The state is *which path the menu was opened on*, and the menu is open when that is the path
   * currently being viewed. Navigating changes the pathname, so the menu closes with no effect involved
   * and no second render - which matters because tapping a link while the panel covers the page would
   * otherwise change the page underneath an open panel.
   *
   * The obvious version of this is `useState(false)` plus an effect that calls `setOpen(false)` when the
   * pathname changes, and it is worse in two ways: React's lint rules flag setting state in an effect
   * (correctly - it is a render, then an effect, then another render), and it closes the menu one frame
   * after the navigation rather than with it. Deriving also covers the browser back button for free,
   * which a link click handler would not.
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenedOn(next ? pathname : null);
    },
    [pathname],
  );

  /**
   * A generated id, not a literal.
   *
   * `aria-controls` has to point at the panel, and a hard-coded id is a duplicate waiting to happen
   * the first time this renders twice on a page. `useId` is stable across server and client render,
   * which a counter or a random value would not be - those produce a hydration mismatch.
   */
  const panelId = useId();

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  useScrollLock(open);

  return (
    <FocusTrap active={open} onClose={close} className="lg:hidden">
      {/*
       * The trigger lives inside the trap container, which is what stops the panel double-toggling.
       * `FocusTrap` closes on a pointer-down outside its container - so with the trigger outside, a
       * tap on it would close the panel and the same tap's click handler would immediately reopen
       * it, and the menu would appear not to respond at all. Inside, it is also first in the focus
       * cycle, which is where a disclosure's trigger belongs.
       */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open);
        }}
        className="inline-flex size-11 items-center justify-center rounded-md text-neutral-700 transition-colors duration-base ease-standard hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {/*
         * The name changes with the state and the state is on `aria-expanded`, so the label says
         * what the button does rather than what the panel is doing. "Close menu" while open reads
         * naturally; "Menu, expanded" is what the two together announce.
         */}
        <Icon icon={open ? X : Menu} size="lg" label={open ? 'Close menu' : 'Open menu'} />
      </button>

      {/*
       * Rendered only when open rather than hidden with a class.
       *
       * A panel hidden with `hidden` is correctly removed from the accessibility tree and the tab
       * order, so either would work - but this panel contains the same five destinations as the
       * desktop nav, and leaving it mounted means every link exists twice in the DOM at all times.
       * That is a trap for anything that counts or queries links, including the accessibility sweep.
       */}
      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-20 z-40 border-b border-border bg-surface shadow-md"
        >
          <nav aria-label="Main" className="mx-auto max-w-site px-6 py-4">
            <ul className="flex list-none flex-col gap-1 p-0">
              {items.map((item) => {
                const current = isCurrent(item.href, pathname);

                return (
                  <li key={item.href}>
                    <NextLink
                      href={item.href}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-center rounded-md px-3 text-button no-underline',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                        current
                          ? 'bg-primary-50 text-foreground'
                          : 'text-neutral-700 hover:bg-surface-subtle hover:text-foreground',
                      )}
                    >
                      {item.label}
                    </NextLink>
                  </li>
                );
              })}
            </ul>

            {/* The two calls to action, which are hidden at this width in the header's right-hand
                group. They are here rather than there so they exist exactly once in the document. */}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              {signedIn ? (
                <ButtonLink as={NextLink} href="/account" variant="outline" fullWidth>
                  Your account
                </ButtonLink>
              ) : (
                <ButtonLink href="/auth/sign-in" variant="outline" fullWidth>
                  Sign In
                </ButtonLink>
              )}
              <ButtonLink as={NextLink} href="/enquiry" variant="accent" fullWidth>
                Make an Enquiry
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </FocusTrap>
  );
}

/**
 * Stops the page behind an open panel from scrolling.
 *
 * The padding compensation is the part that is easy to miss. Removing the scrollbar reclaims its
 * width, so every fixed and centred element - including the sticky header this button sits in - shifts
 * sideways at the moment the menu opens, and shifts back when it closes. Replacing the scrollbar's
 * width with padding keeps the layout still.
 *
 * `scrollbar-gutter: stable` in CSS would be tidier and is not equivalent: it reserves the gutter on
 * every page at all times, which changes the layout of the whole site to solve a problem that only
 * exists while a menu is open.
 */
function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return undefined;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${String(scrollbarWidth)}px`;

    return () => {
      // Restored to what was there before, not to `''`. Something else may legitimately own these
      // properties - a future dialog, or a scroll lock from another component - and blanking them
      // would silently undo it.
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [locked]);
}
