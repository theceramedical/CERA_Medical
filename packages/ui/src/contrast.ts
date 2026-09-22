/**
 * WCAG 2.2 contrast ratio calculation.
 *
 * Implemented rather than taken from a dependency because it is thirty lines of arithmetic
 * defined verbatim in the specification, and the calculation is the evidence behind the
 * accessibility claim in the PRD. A dependency here would mean the numbers come from code
 * nobody in the project has read.
 *
 * Reference: WCAG 2.2 relative luminance and contrast ratio definitions.
 * https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

/** AA thresholds. Section 1.4.3 for text, 1.4.11 for non-text. */
export const AA_NORMAL_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
export const AA_NON_TEXT = 3;

/**
 * Where "large text" begins, in CSS pixels.
 *
 * WCAG defines large as 18pt, or 14pt when bold. Those are point sizes, and at the CSS
 * reference ratio of 96dpi they convert to 24px and 18.66px - not 18px.
 *
 * Worth stating explicitly because the 18pt/18px slip is easy to make and fails in the
 * permissive direction: it relaxes the requirement from 4.5:1 to 3:1 for everything from
 * 18px to 24px, which is exactly the range that body and sub-heading text occupies. An
 * earlier draft of design-language.md section 1.4 made that slip, and it is corrected
 * there now.
 */
export const LARGE_TEXT_MIN_PX = 24;
export const LARGE_TEXT_BOLD_MIN_PX = 18.66;

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Parses `#rgb`, `#rrggbb`, and the 4- and 8-digit forms.
 *
 * Alpha is parsed and then ignored, with no blending against a backdrop. That is a
 * deliberate refusal rather than an omission: a contrast figure for a semi-transparent
 * colour is only meaningful against a known backdrop, and silently treating it as opaque
 * reports a ratio that the user never actually sees. Every token in this design system is
 * opaque; if that changes, this should gain an explicit `over` parameter rather than a
 * quiet assumption.
 */
export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, '');

  if (!/^[0-9a-f]+$/i.test(value) || ![3, 4, 6, 8].includes(value.length)) {
    throw new Error(`Not a hex colour: "${hex}"`);
  }

  // The 3- and 4-digit forms are shorthand for doubled digits, so `#abc` is `#aabbcc`.
  const expanded = value.length <= 4 ? [...value].map((digit) => digit + digit).join('') : value;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

/**
 * Relative luminance, per the WCAG definition.
 *
 * The piecewise transfer function is sRGB gamma decoding: the channel values in a hex
 * colour are gamma-encoded, and averaging them directly - which is the intuitive thing to
 * do - overstates the luminance of dark colours badly enough to pass pairings that fail.
 */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const normalised = value / 255;

    return normalised <= 0.04045 ? normalised / 12.92 : Math.pow((normalised + 0.055) / 1.055, 2.4);
  };

  // Coefficients are the sRGB luminance weights: the eye is far more sensitive to green
  // than to blue, which is why a blue that looks dark can still fail against white.
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Contrast ratio between two colours, from 1 to 21.
 *
 * Symmetric by construction - the lighter of the two always ends up in the numerator - so
 * callers cannot get a different answer by passing foreground and background the other way
 * round.
 */
export function contrastRatio(foreground: string | Rgb, background: string | Rgb): number {
  const a = relativeLuminance(typeof foreground === 'string' ? parseHex(foreground) : foreground);
  const b = relativeLuminance(typeof background === 'string' ? parseHex(background) : background);

  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  // The 0.05 offset models viewing flare; it is in the specification, and it is why pure
  // black on pure white is 21:1 rather than unbounded.
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Rounds down to two decimals.
 *
 * Down, not to nearest. A pairing measuring 4.497:1 must not be reported as "4.50, passes".
 */
export function roundRatio(ratio: number): number {
  return Math.floor(ratio * 100) / 100;
}

/** Whether text at this size and weight counts as large under WCAG 1.4.3. */
export function isLargeText(sizePx: number, bold = false): boolean {
  return sizePx >= (bold ? LARGE_TEXT_BOLD_MIN_PX : LARGE_TEXT_MIN_PX);
}

/**
 * The AA threshold a pairing must reach, given how the text is set.
 *
 * Separated from the pass/fail check so a failure can report the threshold it missed. "3.53
 * fails" prompts the question "against what?"; "3.53, needs 4.5 at 15px" does not.
 */
export function requiredRatio(sizePx: number, bold = false): number {
  return isLargeText(sizePx, bold) ? AA_LARGE_TEXT : AA_NORMAL_TEXT;
}

/** Whether a pairing meets AA for text at a given size and weight. */
export function meetsAA(
  ratio: number,
  options: { readonly sizePx: number; readonly bold?: boolean } = { sizePx: 16 },
): boolean {
  return ratio >= requiredRatio(options.sizePx, options.bold ?? false);
}

/**
 * Samples a linear gradient at both stops and the midpoint.
 *
 * The CTA band puts white text over a horizontal gradient (design-language.md section 5.8),
 * so checking only the two declared stops leaves the middle untested. For a linear
 * interpolation in sRGB the extremes bound the range, but the midpoint is cheap and is
 * what the specification asks to be verified, so it is reported rather than reasoned away.
 */
export function gradientSamples(from: string, to: string): readonly Rgb[] {
  const start = parseHex(from);
  const end = parseHex(to);

  const midpoint: Rgb = {
    r: Math.round((start.r + end.r) / 2),
    g: Math.round((start.g + end.g) / 2),
    b: Math.round((start.b + end.b) / 2),
  };

  return [start, midpoint, end];
}

/** Formats an `Rgb` back to hex, for reporting a sampled gradient stop in test output. */
export function toHex({ r, g, b }: Rgb): string {
  const pad = (value: number): string => value.toString(16).padStart(2, '0');

  return `#${pad(r)}${pad(g)}${pad(b)}`;
}
