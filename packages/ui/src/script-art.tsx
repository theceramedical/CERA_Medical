/**
 * The two handwritten phrases in the reference: "Care Support Wellness For a Brighter Tomorrow"
 * overlaying the hero portrait, and "Your Health Matters" with a heart outline in the CTA band.
 *
 * design-language.md section 2 is explicit that these are **decorative artwork, not text**, and the
 * consequences of that ruling are the whole design of this file:
 *
 *   - **No third font.** Setting them in a script typeface would mean loading a family used on two
 *     elements, which is a font file, a render-blocking fetch, and a layout shift for ornament. The
 *     phrases are drawn from an inline stroke alphabet, so the cost is a few hundred bytes in the
 *     document and no network request.
 *   - **`aria-hidden`, with no option.** Neither phrase adds information. "Care Support Wellness"
 *     announced in the middle of the hero, between the headline and the buttons, is an interruption
 *     made of marketing copy.
 *   - **No `<title>`, no `role="img"`.** Both would put it back in the accessibility tree.
 *
 * The lettering comes from `script-lettering.ts` rather than being drawn per phrase. The first
 * version of this file authored every phrase as a run of unrelated `<path>` elements and rendered as
 * gibberish - the `/dev/design` route is what surfaced it - because nothing tied the `e` in "Care" to
 * the `e` in "Wellness". See that module for the full reasoning.
 */

import { cn } from './cn.ts';
import { layoutScript } from './script-lettering.ts';

export interface ScriptArtProps {
  readonly className?: string;
}

/**
 * The slant.
 *
 * Applied once to the group rather than baked into the path data, so the angle is one number to
 * change. `-12deg` is a forward slant: the glyph box has y increasing downward, so a negative
 * `skewX` pushes ascenders right and looks like a right-leaning hand.
 */
const SLANT = 'skewX(-12)';

/**
 * Shared SVG attributes.
 *
 * `currentColor` for the stroke so the caller's text colour drives it - over the portrait it is
 * white, over a light band it is teal. `strokeLinecap="round"` throughout, because a butt cap is what
 * makes drawn handwriting look like a technical diagram.
 *
 * `vectorEffect="non-scaling-stroke"` is deliberately *not* used: the stroke should scale with the
 * lettering, or the phrase grows thin and spidery at hero size and heavy at a thumbnail.
 */
const STROKE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * The hero overlay.
 *
 * The full phrase, broken where the reference breaks it. An earlier version dropped "For a Brighter
 * Tomorrow" because the hand-drawn paths for it were unusable; with a glyph table the extra words are
 * a longer string and nothing else, and shortening the client's copy to suit an implementation
 * difficulty is not a decision this file gets to make.
 */
export function HeroScript({ className }: ScriptArtProps) {
  const { glyphs, viewBox } = layoutScript(['Care Support Wellness', 'For a Brighter Tomorrow']);

  return (
    <svg
      viewBox={viewBox}
      focusable="false"
      aria-hidden="true"
      className={cn('h-auto w-full', className)}
      {...STROKE_PROPS}
    >
      <g transform={SLANT}>
        {glyphs.map(({ d, x, y, key }) => (
          <path key={key} d={d} transform={`translate(${String(x)} ${String(y)})`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * The CTA band's phrase, with the heart outline from the reference.
 *
 * Hidden below `lg` by the caller rather than here: whether it fits is a layout question, and a
 * component that hid itself at a breakpoint would be surprising in any other layout.
 */
export function CtaScript({ className }: ScriptArtProps) {
  const HEART_SIZE = 32;
  const HEART_GAP = 10;

  const layout = layoutScript(['Your Health', 'Matters']);
  const { glyphs, lineWidths, baselineOf } = layout;

  // Placed off the end of the last line rather than at a constant. The first version used a hard-coded
  // x and sat on top of the word "Health", which is what happens when a magic number is chosen against
  // one phrase and the phrase later changes.
  const heartX = (lineWidths.at(-1) ?? 0) + HEART_GAP;
  const heartBottom = baselineOf(lineWidths.length - 1);

  // Re-laid out once the heart's extent is known, so the viewBox covers it instead of clipping it.
  const { viewBox } = layoutScript(['Your Health', 'Matters'], {
    extraWidth: heartX + HEART_SIZE,
  });

  return (
    <svg
      viewBox={viewBox}
      focusable="false"
      aria-hidden="true"
      className={cn('h-auto w-full', className)}
      {...STROKE_PROPS}
    >
      <g transform={SLANT}>
        {glyphs.map(({ d, x, y, key }) => (
          <path key={key} d={d} transform={`translate(${String(x)} ${String(y)})`} />
        ))}
      </g>
      {/*
        The heart sits outside the skewed group. Skewing it would shear the symmetry into a lopsided
        shape, and a heart is the one mark on the page a reader would notice as wrong.

        Two arcs meeting at a point, drawn as one path so the join at the bottom is a real corner
        rather than two round caps overlapping. Authored with its point at the origin and translated,
        which is what lets the position be computed.
      */}
      <path
        d="M16 0c-9-6-16-12-16-19a9 9 0 0 1 16-5 9 9 0 0 1 16 5c0 7-7 13-16 19Z"
        transform={`translate(${String(heartX)} ${String(heartBottom)})`}
      />
    </svg>
  );
}
