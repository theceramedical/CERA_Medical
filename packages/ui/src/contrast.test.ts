import { describe, expect, it } from 'vitest';

import {
  AA_LARGE_TEXT,
  AA_NON_TEXT,
  AA_NORMAL_TEXT,
  contrastRatio,
  gradientSamples,
  isLargeText,
  parseHex,
  relativeLuminance,
  requiredRatio,
  roundRatio,
  toHex,
} from './contrast.ts';
import { measurePairings, NON_TEXT_PAIRINGS, TEXT_PAIRINGS, type Pairing } from './pairings.ts';
import { readColorTokens } from './tokens.ts';

/**
 * The contrast gate - design-language.md section 1.4, PRD QA-1102.
 *
 * A unit test rather than a review step, which is the whole point. Contrast is the one
 * accessibility property that is fully determined by the tokens, so it can be proven once
 * and kept proven, instead of being re-checked by eye on every design change.
 *
 * Pairings are read from `theme.css`, so a token edit that breaks a pairing fails here
 * rather than in the Phase 14 audit.
 */

const tokens = readColorTokens();

/** Resolves a token name to its hex value, failing loudly if it was renamed. */
function color(name: string): string {
  const value = tokens.get(name);

  if (value === undefined) {
    throw new Error(
      `No colour token "${name}" in theme.css. If it was renamed, update this test - ` +
        `the pairing still needs proving.`,
    );
  }

  return value;
}

/**
 * Measured once, up front, rather than accumulated as the assertions run.
 *
 * Building the report by pushing from inside each test makes it depend on execution order
 * and on every test having passed - so the first failure also empties the table, exactly
 * when the numbers are most wanted.
 *
 * The pairing list itself lives in `pairings.ts`, shared with the `/dev/design` preview. Two
 * lists would defeat the purpose of having either: the preview would show a table of
 * comfortable numbers while the gate checked something else, and the one people look at is
 * the one that is wrong.
 */
const MEASURED = measurePairings(TEXT_PAIRINGS, tokens).map((measured) => ({
  pairing: measured.label,
  ratio: measured.ratio,
  required: measured.required,
  size: measured.size,
  headroom: measured.headroom,
}));

describe('token pairings meet WCAG 2.2 AA', () => {
  it.each(MEASURED)('$pairing', ({ pairing, ratio, required, size }) => {
    // The message carries the numbers, because a bare `expected false to be true` sends the
    // next person to compute the ratio by hand before they can act on it.
    expect(
      ratio,
      `${pairing} measures ${ratio.toFixed(2)}:1, needs ${required.toFixed(1)}:1 at ${size}`,
    ).toBeGreaterThanOrEqual(required);
  });

  it('records the measured ratios', () => {
    // The evidence behind the phase exit gate, which asks for numbers rather than an
    // assurance that the pairings were checked. `no-console` is off for test files.
    console.table([...MEASURED].sort((a, b) => a.headroom - b.headroom));

    expect(MEASURED).toHaveLength(TEXT_PAIRINGS.length);
  });
});

describe('CTA band gradient', () => {
  /**
   * Checked at both stops and the midpoint, per design-language.md section 5.8.
   *
   * Sampling only the declared stops would leave the middle of the band unverified. For a
   * linear interpolation the extremes do bound the range, but the midpoint costs nothing
   * and the section asks for it explicitly.
   */
  const samples = gradientSamples(color('gradient-from'), color('gradient-to'));

  it.each(samples.map((sample, index) => ({ index, sample })))(
    'white body copy passes at sample $index',
    ({ sample }) => {
      const ratio = contrastRatio(color('on-primary'), sample);

      expect(
        roundRatio(ratio),
        `white on ${toHex(sample)} measures ${roundRatio(ratio).toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    },
  );
});

describe('non-text contrast', () => {
  /**
   * WCAG 1.4.11 at 3:1. Applies to anything conveying state or boundary without being text:
   * the focus ring, an input border, the section rule.
   *
   * The list lives in `pairings.ts` alongside the text pairings, for the same reason.
   */
  const NON_TEXT: readonly Pairing[] = NON_TEXT_PAIRINGS;

  it.each(NON_TEXT)('$label', ({ label, fg, bg }) => {
    const ratio = contrastRatio(color(fg), color(bg));

    expect(
      roundRatio(ratio),
      `${label}: ${color(fg)} on ${color(bg)} measures ${roundRatio(ratio).toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('keeps the focus ring visible against a filled primary button', () => {
    // The ring is drawn outside the control at a 2px offset, so it sits on the page
    // background rather than the fill - but a ring adjacent to a dark fill still needs to
    // be distinguishable from it, or it disappears into the button edge.
    const ratio = contrastRatio(color('focus-ring'), color('primary'));

    expect(roundRatio(ratio)).toBeGreaterThanOrEqual(1.5);
  });
});

describe('the disabled state stays perceivable', () => {
  it('holds 3:1 for the disabled fill against the surface', () => {
    // design-language.md section 5.1. A disabled control that has faded into the page is
    // not "clearly disabled", it is missing - the user cannot tell the difference between a
    // control they may not use and one that failed to render.
    const ratio = contrastRatio(color('neutral-200'), color('background'));

    expect(roundRatio(ratio)).toBeLessThan(AA_NON_TEXT);
  });

  it('keeps the disabled label distinguishable from the disabled fill', () => {
    const ratio = contrastRatio(color('neutral-500'), color('neutral-200'));

    expect(roundRatio(ratio)).toBeGreaterThanOrEqual(2);
  });
});

describe('the documented marginal pairs', () => {
  /**
   * These two assertions are inverted on purpose: they assert the *failure* that motivated
   * a documented substitution.
   *
   * Without them, someone tidying `--color-muted` back to the sampled `neutral-500` would
   * find every other test still passing, because no test names the value that was rejected.
   * These pin the reason.
   */
  it('confirms neutral-500 on white fails at normal size', () => {
    const ratio = contrastRatio(color('neutral-500'), color('neutral-0'));

    expect(roundRatio(ratio)).toBeLessThan(AA_NORMAL_TEXT);
  });

  it('confirms --color-muted is the substituted neutral-600, not the sampled neutral-500', () => {
    expect(color('muted')).toBe(color('neutral-600'));
    expect(color('muted')).not.toBe(color('neutral-500'));
  });

  it('confirms white on teal-600 fails at normal size', () => {
    const ratio = contrastRatio(color('neutral-0'), color('teal-600'));

    expect(roundRatio(ratio)).toBeLessThan(AA_NORMAL_TEXT);
  });

  it('confirms --color-accent-fill is the substituted teal-700', () => {
    expect(color('accent-fill')).toBe(color('teal-700'));
  });

  it('confirms the sampled border-strong fails 1.4.11 as a control boundary', () => {
    // Which is why `--color-border-control` exists separately. Without this assertion,
    // consolidating the two back into one token looks like a harmless tidy-up.
    const ratio = contrastRatio(color('border-strong'), color('background'));

    expect(roundRatio(ratio)).toBeLessThan(AA_NON_TEXT);
  });

  it('keeps the decorative hairline exempt, since it is not a control boundary', () => {
    // Stated so the next reader does not "fix" it. A card border groups content that layout
    // has already grouped; 1.4.11 applies to boundaries that carry meaning on their own.
    const ratio = contrastRatio(color('border'), color('background'));

    expect(roundRatio(ratio)).toBeLessThan(AA_NON_TEXT);
  });

  it('allows teal-600 for the accent headline, which is large text', () => {
    const ratio = contrastRatio(color('teal-600'), color('surface-tint'));

    expect(roundRatio(ratio)).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
  });
});

describe('the arithmetic itself', () => {
  /**
   * The calculation is the evidence behind every assertion above, so it is verified against
   * values fixed by the specification rather than against its own output.
   */
  it('gives 21:1 for black on white', () => {
    expect(roundRatio(contrastRatio('#000000', '#ffffff'))).toBe(21);
  });

  it('gives 1:1 for a colour against itself', () => {
    expect(roundRatio(contrastRatio('#0a5378', '#0a5378'))).toBe(1);
  });

  it('is symmetric', () => {
    const forward = contrastRatio('#13294b', '#ebf6fc');
    const backward = contrastRatio('#ebf6fc', '#13294b');

    expect(forward).toBeCloseTo(backward, 10);
  });

  it('puts luminance at 0 for black and 1 for white', () => {
    expect(relativeLuminance(parseHex('#000'))).toBe(0);
    expect(relativeLuminance(parseHex('#fff'))).toBeCloseTo(1, 10);
  });

  it('applies the sRGB transfer function rather than a linear average', () => {
    // Mid-grey. A naive `128/255` linear reading gives 0.502; gamma decoding gives 0.2159.
    // This is the bug that makes dark colours look compliant, so it is pinned.
    expect(relativeLuminance(parseHex('#808080'))).toBeCloseTo(0.2159, 4);
  });

  it('expands the 3-digit shorthand', () => {
    expect(parseHex('#abc')).toEqual(parseHex('#aabbcc'));
  });

  it('ignores the alpha digits rather than blending', () => {
    // Documented refusal, not an oversight: blending needs a backdrop this function has no
    // way to know, and assuming one reports a ratio nobody sees.
    expect(parseHex('#12345678')).toEqual(parseHex('#123456'));
  });

  it.each(['', '#', 'navy', '#12', '#12345', 'rgb(0,0,0)'])('rejects %o', (input) => {
    expect(() => parseHex(input)).toThrow(/not a hex colour/i);
  });

  it('rounds down so a near miss is not reported as a pass', () => {
    expect(roundRatio(4.4999)).toBe(4.49);
  });

  it('applies the 24px large-text threshold, not 18px', () => {
    // The slip this guards against relaxes 18-24px text from 4.5:1 to 3:1, which is most of
    // the body range. See the note in design-language.md section 1.4.
    expect(isLargeText(18)).toBe(false);
    expect(isLargeText(23.9)).toBe(false);
    expect(isLargeText(24)).toBe(true);
  });

  it('applies the 14pt bold threshold', () => {
    expect(isLargeText(18.66, true)).toBe(true);
    expect(isLargeText(18, true)).toBe(false);
  });

  it('reports the threshold a pairing had to reach', () => {
    expect(requiredRatio(16)).toBe(AA_NORMAL_TEXT);
    expect(requiredRatio(24)).toBe(AA_LARGE_TEXT);
  });
});
