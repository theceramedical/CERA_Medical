import { describe, expect, it } from 'vitest';

import { contrastRatio } from './contrast.ts';
import {
  colorToken,
  measureAgainstSample,
  measurePairings,
  NON_TEXT_PAIRINGS,
  TEXT_PAIRINGS,
} from './pairings.ts';
import { readColorTokens } from './tokens.ts';

/**
 * Tests for the shared pairing list.
 *
 * `contrast.test.ts` proves the *ratios*. This proves the *machinery that reports them*, which is a
 * different thing and now has two consumers: the gate and the `/dev/design` preview. A bug here -
 * a wrong threshold, a `passes` flag that disagrees with the numbers beside it - would make both of
 * them lie in the same direction, which is exactly the failure sharing the list was meant to remove.
 */

const tokens = readColorTokens();

describe('the pairing lists', () => {
  it('cover both text and non-text criteria', () => {
    expect(TEXT_PAIRINGS.length).toBeGreaterThan(0);
    expect(NON_TEXT_PAIRINGS.length).toBeGreaterThan(0);
  });

  it('name only tokens that exist', () => {
    // Every token name is resolved, so a rename in theme.css fails here rather than rendering a
    // swatch of nothing on the preview page.
    for (const { fg, bg } of [...TEXT_PAIRINGS, ...NON_TEXT_PAIRINGS]) {
      expect(() => colorToken(fg, tokens)).not.toThrow();
      expect(() => colorToken(bg, tokens)).not.toThrow();
    }
  });

  it('have no duplicate labels', () => {
    // The labels are React keys on the preview and test names in the gate. A duplicate silently
    // drops a row from one and produces two identically named tests in the other.
    const labels = [...TEXT_PAIRINGS, ...NON_TEXT_PAIRINGS].map(({ label }) => label);

    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('colorToken', () => {
  it('resolves a semantic name through to a literal', () => {
    expect(colorToken('primary', tokens)).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('throws on a name that does not exist, naming the token', () => {
    expect(() => colorToken('not-a-token', tokens)).toThrow(/not-a-token/);
  });
});

describe('measurePairings', () => {
  it('requires 4.5:1 below the large-text threshold', () => {
    const [measured] = measurePairings(
      [{ label: 'small text', fg: 'copy', bg: 'background', sizePx: 16 }],
      tokens,
    );

    expect(measured?.required).toBe(4.5);
  });

  /**
   * 24px, not 18px.
   *
   * WCAG defines large text as 18pt, which is 24 CSS pixels at the reference 96dpi. The 18pt/18px
   * slip relaxes the requirement from 4.5:1 to 3:1 across 18-24px, which is exactly where body and
   * sub-heading text lives, so it is worth pinning from this side too.
   */
  it('requires 3:1 at and above 24px', () => {
    const [at24] = measurePairings(
      [{ label: 'large text', fg: 'copy', bg: 'background', sizePx: 24 }],
      tokens,
    );
    const [at23] = measurePairings(
      [{ label: 'not quite large', fg: 'copy', bg: 'background', sizePx: 23 }],
      tokens,
    );

    expect(at24?.required).toBe(3);
    expect(at23?.required).toBe(4.5);
  });

  it('requires 3:1 for a non-text pairing rather than falling through to 4.5', () => {
    // `requiredRatio(0)` returns 4.5, since 0px is not large text. A non-text pairing is governed by
    // 1.4.11 instead, and delegating to `requiredRatio` would hold focus rings to a threshold the
    // specification does not ask for - failing the build over a compliant design.
    const [measured] = measurePairings(
      [{ label: 'a border', fg: 'border-control', bg: 'background', sizePx: 0 }],
      tokens,
    );

    expect(measured?.required).toBe(3);
    expect(measured?.size).toBe('non-text');
  });

  it('agrees with contrastRatio and reports the resolved hex', () => {
    const [measured] = measurePairings(
      [{ label: 'copy on white', fg: 'copy', bg: 'background', sizePx: 16 }],
      tokens,
    );

    expect(measured?.fgHex).toBe(colorToken('copy', tokens));
    expect(measured?.bgHex).toBe(colorToken('background', tokens));
    // Rounded down, so within one hundredth of the unrounded figure and never above it.
    expect(measured?.ratio).toBeLessThanOrEqual(
      contrastRatio(colorToken('copy', tokens), colorToken('background', tokens)),
    );
  });

  it('sets passes from the measured ratio, not from a separate judgement', () => {
    // A `passes` that can disagree with the ratio printed next to it is worse than no flag at all.
    for (const measured of measurePairings(TEXT_PAIRINGS, tokens)) {
      expect(measured.passes).toBe(measured.ratio >= measured.required);
    }
  });

  it('marks bold text large at 18.66px', () => {
    const [bold] = measurePairings(
      [{ label: 'bold heading', fg: 'copy', bg: 'background', sizePx: 19, bold: true }],
      tokens,
    );

    expect(bold?.required).toBe(3);
    expect(bold?.size).toBe('19px bold');
  });
});

describe('measureAgainstSample', () => {
  it('measures against a colour that is not a token', () => {
    // The CTA gradient midpoint exists only as a computed sample, so it has no token name. Without
    // this path the middle of the band would go unreported on the preview.
    const measured = measureAgainstSample(
      'white on a gradient midpoint',
      'on-primary',
      { r: 0x1d, g: 0x35, b: 0x58 },
      '#1d3558',
      tokens,
    );

    expect(measured.bg).toBe('#1d3558');
    expect(measured.required).toBe(4.5);
    expect(measured.passes).toBe(measured.ratio >= 4.5);
  });
});
