import { describe, expect, it } from 'vitest';

import { BASELINE, DESCENDER, LINE_HEIGHT, layoutScript } from './script-lettering.ts';

/**
 * Tests for the stroke alphabet.
 *
 * Legibility cannot be asserted - whether a path looks like an `e` is a question for a pair of eyes,
 * and the `/dev/design` route is what answers it. What *can* be asserted is everything around it, and
 * the original defect in `script-art.tsx` failed on several of these rather than on the drawing: it
 * rendered letters nothing tied together, in a viewBox that did not match the content, with no way to
 * notice a character it could not draw.
 *
 * So: every phrase the product uses is laid out here, so a missing glyph is a test failure rather than
 * a gap in a picture nobody inspects.
 */

/** The exact copy from the reference, which is what the components render. */
const PHRASES: readonly (readonly string[])[] = [
  ['Care Support Wellness', 'For a Brighter Tomorrow'],
  ['Your Health', 'Matters'],
];

describe('layoutScript', () => {
  it.each(PHRASES.map((lines) => ({ phrase: lines.join(' / '), lines })))(
    'draws every character of "$phrase"',
    ({ lines }) => {
      const { glyphs } = layoutScript(lines);

      // One glyph per non-space character. A silently skipped letter is the defect this catches.
      const expected = lines.join('').replaceAll(' ', '').length;

      expect(glyphs).toHaveLength(expected);
    },
  );

  it('throws on a character it has no glyph for, naming the character', () => {
    // Loudly, rather than substituting or skipping. The phrases are compiled-in copy, so an unknown
    // character is a mistake in the source - and a gap in decoration is exactly what goes unnoticed.
    expect(() => layoutScript(['Zebra'])).toThrow(/No script glyph for "Z"/);
  });

  it('gives every glyph a unique key', () => {
    // Repeated letters are the norm here - "Wellness" has three - and duplicate React keys would make
    // one of them vanish on re-render.
    const { glyphs } = layoutScript(['Wellness', 'Wellness']);
    const keys = glyphs.map(({ key }) => key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('advances left to right and never backwards', () => {
    const { glyphs } = layoutScript(['Matters']);
    const xs = glyphs.map(({ x }) => x);

    expect(xs).toStrictEqual([...xs].sort((a, b) => a - b));
    expect(new Set(xs).size).toBe(xs.length);
  });

  it('puts each line on its own baseline', () => {
    const { glyphs, baselineOf } = layoutScript(['Your', 'Health', 'Matters']);

    expect(new Set(glyphs.map(({ y }) => y))).toStrictEqual(
      new Set([0, LINE_HEIGHT, LINE_HEIGHT * 2]),
    );
    expect(baselineOf(0)).toBe(BASELINE);
    expect(baselineOf(2)).toBe(LINE_HEIGHT * 2 + BASELINE);
  });

  it('advances the pen across a space without drawing one', () => {
    const withSpace = layoutScript(['Your Health']);
    const withoutSpace = layoutScript(['YourHealth']);

    expect(withSpace.glyphs).toHaveLength(withoutSpace.glyphs.length);
    // The space has to cost something, or the two words run together.
    expect(withSpace.lineWidths[0]).toBeGreaterThan(withoutSpace.lineWidths[0] ?? 0);
  });

  it('reports a width per line', () => {
    const { lineWidths } = layoutScript(['Matters', 'Your Health']);

    expect(lineWidths).toHaveLength(2);
    // "Your Health" is the longer string and must measure longer, or a mark placed off the end of a
    // line lands in the middle of it - which is how the heart came to overlap the word "Health".
    expect(lineWidths[1]).toBeGreaterThan(lineWidths[0] ?? 0);
  });

  describe('the viewBox', () => {
    /** Parses the four numbers, so the assertions can be about geometry rather than a string. */
    function box(viewBox: string) {
      const [minX = 0, minY = 0, width = 0, height = 0] = viewBox
        .split(' ')
        .map((part) => Number(part));

      return { minX, minY, width, height };
    }

    it('encloses every glyph, with room for the slant and the stroke', () => {
      const { glyphs, viewBox, lineWidths } = layoutScript(['Care Support Wellness']);
      const { minX, minY, width, height } = box(viewBox);

      // Negative origin: the skew pushes ascenders left of x=0 and half the stroke sits outside the
      // path. Without it the `W` is clipped, which reads as a broken path rather than a bad viewBox.
      expect(minX).toBeLessThan(0);
      expect(minY).toBeLessThan(0);
      expect(minX + width).toBeGreaterThan(lineWidths[0] ?? 0);
      expect(minY + height).toBeGreaterThan(BASELINE + DESCENDER);
      expect(glyphs.every(({ x }) => x >= minX)).toBe(true);
    });

    it('grows for each extra line', () => {
      const one = box(layoutScript(['Matters']).viewBox);
      const two = box(layoutScript(['Matters', 'Matters']).viewBox);

      expect(two.height - one.height).toBe(LINE_HEIGHT);
    });

    it('reserves width for a mark the caller draws', () => {
      // The CTA heart is drawn by `CtaScript`, not by the layout, so the layout has to be told about
      // it or the browser clips it at the right edge.
      const plain = box(layoutScript(['Matters']).viewBox);
      const reserved = box(layoutScript(['Matters'], { extraWidth: 500 }).viewBox);

      expect(reserved.width).toBeGreaterThan(plain.width);
      expect(reserved.minX + reserved.width).toBeGreaterThanOrEqual(500);
    });

    it('ignores extraWidth narrower than the text', () => {
      // Otherwise a caller reserving less than the phrase needs would silently crop it.
      const plain = box(layoutScript(['Care Support Wellness']).viewBox);
      const reserved = box(layoutScript(['Care Support Wellness'], { extraWidth: 1 }).viewBox);

      expect(reserved.width).toBe(plain.width);
    });
  });
});
