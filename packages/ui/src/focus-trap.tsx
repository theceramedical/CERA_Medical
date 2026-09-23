'use client';

import { useCallback, useEffect, useRef } from 'react';

import type { ReactNode } from 'react';

/**
 * Keeps keyboard focus inside an open overlay, and returns it where it came from on close.
 *
 * Needed by the mobile nav disclosure (design-language.md section 5.5: "focus trapped while open,
 * `Escape` closes and returns focus to the trigger"). Without a trap, Tab walks straight out of the
 * open panel and into the page behind it - which is still on screen but covered - so the focus ring
 * vanishes and the user is operating controls they cannot see.
 *
 * Written rather than taken from a dependency because the behaviour is about sixty lines and the
 * dependency would be another package to audit for a component set this small. The parts that are
 * easy to get wrong are called out inline.
 */

/**
 * Elements that can hold focus.
 *
 * `:not([disabled])` and the `tabindex="-1"` exclusion both matter. A disabled control is skipped
 * by the browser, so including it would make the trap cycle to an element the browser refuses to
 * focus, and focus would land on `<body>` instead - outside the trap, which is the exact failure
 * this component exists to prevent.
 */
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(',');

/**
 * Whether an element can actually receive focus, as opposed to merely matching the selector.
 *
 * `checkVisibility` is the right answer and is what every current browser engine gets used here.
 * The fallback exists because it is unimplemented in jsdom, and a trap whose visibility check
 * returns `false` for everything focuses nothing at all - so without a fallback the component
 * would be untestable, and an untested focus trap is the kind that ships subtly broken.
 *
 * The fallback walks ancestors rather than reading the element's own computed style, because
 * `display: none` on a wrapper leaves the child reporting its own display value unchanged.
 */
function isVisible(element: HTMLElement, container: HTMLElement): boolean {
  if (typeof element.checkVisibility === 'function') return element.checkVisibility();

  const view = element.ownerDocument.defaultView;
  if (view === null) return true;

  let node: HTMLElement | null = element;

  while (node !== null) {
    const style = view.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (node === container) break;

    node = node.parentElement;
  }

  return true;
}

export interface FocusTrapProps {
  /** Whether the trap is armed. Rendering it inert rather than conditionally mounting it. */
  readonly active: boolean;
  /**
   * Called on `Escape` and on a click outside.
   *
   * Both are required exits. A trap with no escape is a keyboard user stuck in a panel with no way
   * out short of reloading the page - strictly worse than no trap at all.
   */
  readonly onClose: () => void;
  readonly className?: string;
  readonly children: ReactNode;
}

export function FocusTrap({ active, onClose, className, children }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  /**
   * What had focus before the trap armed.
   *
   * Captured in a ref rather than read at close time, because by then the trigger may have been
   * re-rendered and `document.activeElement` is `<body>`. Returning focus to the trigger is what
   * stops a keyboard user being dumped at the top of the document every time they close a menu.
   */
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const focusableElements = useCallback((): readonly HTMLElement[] => {
    const container = containerRef.current;
    if (container === null) return [];

    // A selector match is not enough: a collapsed sub-panel inside the trap still contains matching
    // elements, and including them makes the trap appear to skip a turn as focus goes somewhere
    // invisible.
    return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) =>
      isVisible(element, container),
    );
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Focus the first thing in the panel. Without this the trap is armed but focus is still
    // outside it, so the first Tab escapes before the handler below ever sees a keypress.
    const [first] = focusableElements();
    first?.focus();

    return () => {
      // Guarded, because the trigger may have been removed from the document along with the panel.
      if (previouslyFocused.current?.isConnected === true) previouslyFocused.current.focus();
    };
  }, [active, focusableElements]);

  useEffect(() => {
    if (!active) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = focusableElements();
      if (elements.length === 0) {
        // Nothing to cycle between, so keep focus from leaving at all.
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements.at(-1);
      if (first === undefined || last === undefined) return;

      const activeElement = document.activeElement;

      /**
       * Only the wrap-around is intercepted. Tab between interior elements is left to the browser,
       * which gets reading order, nested tab indexes, and shadow roots right in ways a manual
       * "focus the next element in my array" implementation does not.
       */
      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [active, onClose, focusableElements]);

  useEffect(() => {
    if (!active) return undefined;

    function onPointerDown(event: MouseEvent) {
      const container = containerRef.current;
      if (container === null) return;
      if (event.target instanceof Node && container.contains(event.target)) return;

      onClose();
    }

    /**
     * `mousedown`, not `click`.
     *
     * A `click` listener fires after the mouse button is released, by which time the browser has
     * already moved focus to whatever was underneath - so the panel closes and the restore-focus
     * cleanup then yanks focus back to the trigger, undoing the user's click.
     */
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [active, onClose]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
