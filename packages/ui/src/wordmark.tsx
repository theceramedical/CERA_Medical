import { cn } from './cn.ts';

import type { ElementType } from 'react';

/**
 * The CERA Medical lock-up: a cross-and-leaf mark, `CERA` in Montserrat 700, and `MEDICAL` tracked
 * beneath it (design-language.md sections 5.5 and 2).
 *
 * **The wordmark is text, not an image.** `CERA MEDICAL` is set in the real typeface rather than
 * traced into SVG paths, and the mark beside it is the only part that is drawn. That choice costs
 * nothing visually - Montserrat 700 is already loaded for exactly this - and it buys: text that
 * scales with the user's font size, text that survives 200% zoom and 400% reflow without becoming a
 * blurry bitmap, text that can be selected and copied, and text a screen reader reads as words
 * rather than as an `alt` string somebody has to maintain separately.
 *
 * Only the glyph is an SVG, and it is `aria-hidden`: a mark that sits immediately beside the words
 * it stands for adds nothing to the announcement.
 */

export interface WordmarkProps {
  /**
   * What to render as.
   *
   * `div` by default. In the header it is wrapped in a link to `/`, and in the footer it is usually
   * plain. It is never a heading: a logo is not a section title, and making it an `h1` gives every
   * page the same first heading and pushes the real one to `h2`.
   */
  readonly as?: ElementType;
  /**
   * Inverts the colours for a dark background.
   *
   * A prop rather than `currentColor` throughout, because the mark and the two words use three
   * different inks on light backgrounds and a single one on dark. Deriving that from context would
   * be guesswork.
   */
  readonly onDark?: boolean;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

export function Wordmark({
  as: Component = 'div',
  onDark = false,
  size = 'md',
  className,
}: WordmarkProps) {
  return (
    <Component className={cn('inline-flex items-center gap-2.5', className)}>
      <CrossAndLeaf
        className={cn(
          size === 'sm' ? 'size-7' : 'size-9',
          onDark ? 'text-on-primary' : 'text-primary',
        )}
      />

      {/* `leading-none` on the stack so the two words sit tight, as in the reference, rather than
          inheriting the body line-height and leaving a visible gap. */}
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-wordmark font-bold',
            size === 'sm' ? 'text-h4' : 'text-h3',
            onDark ? 'text-on-primary' : 'text-foreground',
          )}
        >
          CERA
        </span>
        <span
          className={cn(
            // One step, not `text-pill` plus `tracking-wordmark`: the size, the 0.28em tracking, and
            // the weight travel together, and combining two utilities would leave the letter-spacing
            // decided by stylesheet order. See the token's comment in theme.css.
            'font-wordmark text-wordmark-sub',
            onDark ? 'text-on-primary/80' : 'text-muted',
          )}
        >
          MEDICAL
        </span>
      </span>
    </Component>
  );
}

export interface CrossAndLeafProps {
  readonly className?: string;
}

/**
 * The mark: a medical cross whose upper-right arm resolves into a leaf.
 *
 * `currentColor` for every fill, so the caller's text colour drives it and forced-colours mode
 * substitutes a system colour rather than leaving an invisible shape.
 *
 * `aria-hidden` with no escape hatch. Every place this appears, the word `CERA` is beside it.
 */
export function CrossAndLeaf({ className }: CrossAndLeafProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      // `focusable="false"` as well as `aria-hidden`: Internet Explorer's legacy behaviour of making
      // SVG a tab stop is gone, but Edge in IE mode still honours it, and a silent tab stop is the
      // resulting symptom.
      focusable="false"
      aria-hidden="true"
      className={className}
    >
      {/* The cross. Drawn as one path rather than two overlapping rectangles so the corner radii
          meet cleanly at the intersections. */}
      <path
        fill="currentColor"
        d="M15.5 4h9a2 2 0 0 1 2 2v9.5H36a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9.5V38a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9.5H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9.5V6a2 2 0 0 1 2-2Z"
        opacity="0.18"
      />
      <path
        fill="currentColor"
        d="M16.75 7h6.5a1 1 0 0 1 1 1v9.75H34a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-9.75V36a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-9.75H6a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1h9.75V8a1 1 0 0 1 1-1Z"
      />
      {/* The leaf, rising from the cross's upper-right shoulder. */}
      <path
        fill="currentColor"
        d="M26 14.5c0-5.25 3.9-9.7 9.4-11.4.7-.2 1.4.4 1.3 1.1-.7 6-4.2 10.3-9.1 11.6a1 1 0 0 1-1.2-.7 5.6 5.6 0 0 1-.4-.6Z"
      />
      <path
        fill="currentColor"
        opacity="0.55"
        d="M27.4 15.3c1.4-3.7 4-6.6 7.4-8.2.5-.2 1 .4.6.8-2.6 2.4-4.6 5-6 8a.8.8 0 0 1-1.5-.6Z"
      />
    </svg>
  );
}
