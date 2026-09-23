/**
 * A monoline stroke alphabet for the two decorative phrases in the reference.
 *
 * **Why a glyph table rather than one hand-drawn path per phrase.** The first version of
 * `script-art.tsx` authored every phrase as a sequence of ad-hoc `<path>` elements, and the result
 * rendered as gibberish - "Care Support Wellness" came out as "ArzSopctr Wsllnzss". The failure mode
 * is structural, not a typo: with forty unrelated paths there is nothing that says the `e` in "Care"
 * and the `e` in "Wellness" should be the same shape, so each one is drawn again slightly wrong, and
 * the only way to check any of it is to look at a rendered page. Nobody looks at ornament.
 *
 * Defining each letter once fixes the class of bug rather than the instance. A phrase becomes a
 * string, a letter is authored and verified once, and the same `e` appears everywhere.
 *
 * **This is not a font, and deliberately not.** design-language.md section 2 rejects loading a third
 * family for two ornamental elements, and the reason - a render-blocking fetch and a layout shift for
 * decoration - still holds. Nothing here is fetched: the glyphs are inline path data, so the cost is
 * a few hundred bytes in the document and no network request. What was rejected was the fetch, not
 * the idea of reusing a letter shape.
 *
 * Coordinates are in a normalised em box shared by every glyph, which is what keeps the baseline flat
 * and the x-height even:
 *
 *   y = 0    ascender / cap height
 *   y = 8    x-height
 *   y = 20   baseline
 *   y = 28   descender
 *
 * The handwritten slant comes from a single `skewX` on the group rather than from slanted path data.
 * Slanting the data would mean every glyph carries the skew, and correcting the angle later would
 * mean redrawing all of them.
 */

/** Baseline-to-baseline distance, in em-box units. Loose, because the phrases are two short lines. */
export const LINE_HEIGHT = 32;

/** Where the baseline sits within the em box. */
export const BASELINE = 20;

/** How far the tail of a `g` or `p` drops below the baseline. */
export const DESCENDER = 8;

/** Extra space between glyphs, on top of each glyph's own advance. */
const LETTER_SPACING = 1.5;

/** The width of a space character. */
const SPACE_ADVANCE = 7;

interface Glyph {
  /** Stroke path data, in the shared em box. */
  readonly d: string;
  /** How far the pen moves after drawing, before letter spacing. */
  readonly advance: number;
}

/**
 * Every glyph the two phrases need, and no more.
 *
 * Restricted on purpose. A partial alphabet that throws on an unknown character is far better than a
 * complete one that is half-guessed: the phrases are fixed copy, and a missing letter should be a
 * build-time failure rather than a gap in the drawing.
 */
const GLYPHS: Readonly<Record<string, Glyph>> = {
  // Lowercase. The x-height band is y=8 to y=20 throughout, which is what makes the line read as
  // one hand rather than as a ransom note.
  a: { d: 'M11 11c-2-3-6-3-8 0s-3 8 0 9c3 2 6 0 8-3M11 8v12', advance: 13 },
  e: { d: 'M2 14h9c0-4-2-6-4-6-3 0-5 3-5 6s2 6 5 6c2 0 3 0 4-2', advance: 12 },
  g: { d: 'M11 11c-2-3-6-3-8 0s-3 8 0 9c3 2 6 0 8-3M11 8v14c0 4-3 6-7 5', advance: 13 },
  h: { d: 'M2 20V1m0 11c2-3 4-4 6-3 2 0 3 2 3 5v7', advance: 13 },
  // The dot is a separate subpath rather than a circle, so the whole alphabet is strokes and one
  // `stroke-linecap` governs every terminal.
  i: { d: 'M4 8v12M4 3v0.5', advance: 8 },
  l: { d: 'M4 1v15c0 3 1 4 4 4', advance: 10 },
  m: { d: 'M2 20V8m0 4c1-3 3-4 5-3 1 0 2 2 2 4v8m0-8c1-3 3-4 5-3 1 0 2 2 2 4v7', advance: 18 },
  n: { d: 'M2 20V8m0 4c2-3 4-4 6-3 2 0 3 2 3 5v7', advance: 13 },
  o: { d: 'M7 8c-3 0-5 3-5 6s2 6 5 6 5-3 5-6-2-6-5-6Z', advance: 13 },
  p: { d: 'M2 8v20m0-16c1-3 3-4 5-4 3 0 5 3 5 6s-2 6-5 6c-2 0-4-1-5-3', advance: 13 },
  r: { d: 'M2 20V8m0 5c1-3 4-5 7-5', advance: 10 },
  s: { d: 'M10 10c-3-2-7-2-7 1s6 2 6 5-4 4-7 2', advance: 11 },
  t: { d: 'M5 2v14c0 3 1 4 4 4M2 8h7', advance: 11 },
  u: { d: 'M2 8v8c0 3 2 4 4 4s5-2 5-5V8m0 0v12', advance: 13 },
  w: { d: 'M2 8l3 12 4-9 4 9 3-12', advance: 17 },

  // Capitals, cap height y=0 to the baseline.
  B: { d: 'M2 20V1h6c4 0 6 2 6 4s-2 5-6 5H2m0 0h7c4 0 6 2 6 5s-2 5-6 5H2', advance: 17 },
  C: { d: 'M15 5c-2-3-5-5-8-4-4 1-6 5-6 9s2 9 6 10c3 1 6-1 8-4', advance: 17 },
  F: { d: 'M2 20V1h12M2 10h8', advance: 15 },
  H: { d: 'M2 20V1m12 19V1M2 10h12', advance: 16 },
  M: { d: 'M2 20V1l7 13 7-13v19', advance: 18 },
  S: { d: 'M14 5c-2-3-6-5-9-3-3 1-3 5 1 7s7 3 7 6-4 5-8 4c-2-1-3-2-4-3', advance: 16 },
  T: { d: 'M2 1h14M9 1v19', advance: 17 },
  W: { d: 'M2 1l4 19 5-14 5 14 4-19', advance: 21 },
  Y: { d: 'M2 1l7 10 7-10M9 11v9', advance: 17 },
};

export interface PositionedGlyph {
  readonly d: string;
  readonly x: number;
  readonly y: number;
  /** A stable React key. The character alone repeats within a phrase. */
  readonly key: string;
}

export interface ScriptLayout {
  readonly glyphs: readonly PositionedGlyph[];
  /** A `viewBox` sized to the drawn content, so the caller never has to guess one. */
  readonly viewBox: string;
  /**
   * The advance width of each line, so a caller can place a mark beside the text.
   *
   * Returned rather than left to the caller to eyeball. The heart in the CTA band was first placed at
   * a hard-coded x and overlapped the word "Health", because a constant chosen against one phrase
   * stops being right the moment the phrase, the letter spacing, or a glyph's advance changes.
   */
  readonly lineWidths: readonly number[];
  /** The baseline of a given line, so a mark can sit on it. */
  readonly baselineOf: (line: number) => number;
}

/**
 * Lays out one or more lines of text as positioned glyphs.
 *
 * Throws on a character with no glyph. The phrases are fixed copy compiled into the bundle, so an
 * unknown letter is a mistake in the source rather than user input - and failing loudly is the only
 * way a missing letter in decoration gets noticed at all.
 */
export function layoutScript(
  lines: readonly string[],
  /**
   * Extra width to reserve past the text, for a mark the caller draws itself.
   *
   * Passed in rather than measured, because the `viewBox` has to cover the mark or the browser clips
   * it - and the layout has no way to know what the caller intends to add.
   */
  options: { readonly extraWidth?: number } = {},
): ScriptLayout {
  const glyphs: PositionedGlyph[] = [];
  const lineWidths: number[] = [];
  let widest = 0;

  lines.forEach((line, lineIndex) => {
    let x = 0;

    for (const [charIndex, char] of [...line].entries()) {
      if (char === ' ') {
        x += SPACE_ADVANCE;
        continue;
      }

      const glyph = GLYPHS[char];

      if (glyph === undefined) {
        throw new Error(
          `No script glyph for "${char}". The alphabet in script-lettering.ts covers only the ` +
            `characters the two decorative phrases use; add the glyph rather than substituting one.`,
        );
      }

      glyphs.push({
        d: glyph.d,
        x,
        y: lineIndex * LINE_HEIGHT,
        key: `${String(lineIndex)}-${String(charIndex)}-${char}`,
      });

      x += glyph.advance + LETTER_SPACING;
    }

    // The trailing letter spacing is not part of the line, or every phrase would sit off-centre.
    const width = x - LETTER_SPACING;

    lineWidths.push(width);
    widest = Math.max(widest, width);
  });

  /**
   * Padding for the skew and the stroke.
   *
   * `skewX` on the group pushes the top of every ascender to the left and the bottom of every
   * descender to the right, and half the stroke width sits outside the path itself. Without the
   * margin the `W` and the `y` tail are clipped by the viewBox, which looks like a broken path
   * rather than a layout mistake.
   */
  const PAD = 8;
  const height = (lines.length - 1) * LINE_HEIGHT + BASELINE + DESCENDER;
  const width = Math.max(widest, options.extraWidth ?? 0);

  return {
    glyphs,
    lineWidths,
    baselineOf: (line) => line * LINE_HEIGHT + BASELINE,
    viewBox: `${String(-PAD)} ${String(-PAD)} ${String(width + PAD * 2)} ${String(height + PAD * 2)}`,
  };
}
