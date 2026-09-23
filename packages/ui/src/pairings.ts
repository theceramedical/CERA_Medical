import { contrastRatio, requiredRatio, roundRatio, type Rgb } from './contrast.ts';
import { readColorTokens } from './tokens.ts';

/**
 * The contrast pairings from design-language.md section 1.4, and the code that measures them.
 *
 * Extracted out of `contrast.test.ts` so the `/dev/design` preview shows exactly the set the gate
 * enforces. Two lists would defeat the purpose of having either: the preview would display a table
 * of comfortable numbers while the gate checked something else, and the one people look at is the
 * one that is wrong.
 *
 * Node only - it reads `theme.css` through `tokens.ts`. The preview route is a server component,
 * so it runs here too.
 */

export interface Pairing {
  readonly label: string;
  /** A token name without the `--color-` prefix. */
  readonly fg: string;
  readonly bg: string;
  /**
   * The size the pairing is actually used at, which is what sets the threshold. `0` marks a
   * non-text pairing under SC 1.4.11.
   *
   * The load-bearing column. A pairing is not "compliant" in the abstract - white on teal-600
   * passes for a hero headline and fails for a pill label - and recording the size is what stops
   * the table being reinterpreted later to suit whatever needs to pass.
   */
  readonly sizePx: number;
  readonly bold?: boolean;
}

/** Text pairings, checked against SC 1.4.3. */
export const TEXT_PAIRINGS: readonly Pairing[] = [
  // Headings. display-1 floors at 32px and h4 is 16px, so the tightest heading case is h4.
  { label: 'heading ink on white', fg: 'foreground', bg: 'background', sizePx: 16 },
  { label: 'heading ink on hero tint', fg: 'foreground', bg: 'surface-tint', sizePx: 16 },
  { label: 'heading ink on process tint', fg: 'foreground', bg: 'surface-tint-2', sizePx: 16 },
  { label: 'heading ink on footer tint', fg: 'foreground', bg: 'surface-footer', sizePx: 16 },

  // Body copy. The token is `copy` rather than `body` to avoid a Tailwind utility collision;
  // see the note in design-language.md section 1.3.
  { label: 'copy on white', fg: 'copy', bg: 'background', sizePx: 16 },
  { label: 'copy on hero tint', fg: 'copy', bg: 'surface-tint', sizePx: 16 },
  { label: 'copy on process tint', fg: 'copy', bg: 'surface-tint-2', sizePx: 16 },
  { label: 'copy on icon disc', fg: 'copy', bg: 'icon-disc', sizePx: 16 },

  // Muted text at caption size - 13px, the tightest case in the system.
  { label: 'muted on white at caption', fg: 'muted', bg: 'background', sizePx: 13 },
  { label: 'muted on footer tint at caption', fg: 'muted', bg: 'surface-footer', sizePx: 13 },
  { label: 'muted on subtle surface at caption', fg: 'muted', bg: 'surface-subtle', sizePx: 13 },

  // Button labels. `button` type is 15px, below the 24px large threshold, so 4.5:1 applies.
  { label: 'label on filled primary', fg: 'on-primary', bg: 'primary', sizePx: 15 },
  { label: 'label on primary hover', fg: 'on-primary', bg: 'primary-hover', sizePx: 15 },
  { label: 'label on primary active', fg: 'on-primary', bg: 'primary-active', sizePx: 15 },
  { label: 'label on accent fill', fg: 'on-accent', bg: 'accent-fill', sizePx: 15 },
  { label: 'outline button ink on white', fg: 'foreground', bg: 'surface', sizePx: 15 },
  { label: 'ghost button ink on white', fg: 'primary', bg: 'background', sizePx: 15 },
  { label: 'ghost button ink on process tint', fg: 'primary', bg: 'surface-tint-2', sizePx: 15 },
  { label: 'on-dark button ink on white', fg: 'primary', bg: 'on-primary', sizePx: 15 },

  // Pill labels are 11px - the smallest text in the system, so the strictest case.
  { label: 'pill label on accent fill', fg: 'on-accent', bg: 'accent-fill', sizePx: 11 },

  // The accent headline is display-1, which floors at 32px and so is large text.
  { label: 'accent headline on hero tint', fg: 'accent-hover', bg: 'surface-tint', sizePx: 32 },

  // Validation. Error help text is caption size.
  { label: 'danger help text on white', fg: 'danger-700', bg: 'background', sizePx: 13 },
  { label: 'danger help text on danger tint', fg: 'danger-700', bg: 'danger-50', sizePx: 13 },
  { label: 'success text on success tint', fg: 'success-700', bg: 'success-50', sizePx: 13 },
  { label: 'warning text on warning tint', fg: 'warning-700', bg: 'warning-50', sizePx: 13 },
];

/**
 * Non-text pairings, checked against SC 1.4.11 at 3:1.
 *
 * Applies to anything conveying state or a boundary without being text: the focus ring, a control
 * border, the section rule.
 */
export const NON_TEXT_PAIRINGS: readonly Pairing[] = [
  { label: 'focus ring on white', fg: 'focus-ring', bg: 'background', sizePx: 0 },
  { label: 'focus ring on hero tint', fg: 'focus-ring', bg: 'surface-tint', sizePx: 0 },
  { label: 'focus ring on process tint', fg: 'focus-ring', bg: 'surface-tint-2', sizePx: 0 },
  { label: 'focus ring on footer tint', fg: 'focus-ring', bg: 'surface-footer', sizePx: 0 },
  { label: 'control border on white', fg: 'border-control', bg: 'background', sizePx: 0 },
  { label: 'control border on hero tint', fg: 'border-control', bg: 'surface-tint', sizePx: 0 },
  {
    label: 'control border on process tint',
    fg: 'border-control',
    bg: 'surface-tint-2',
    sizePx: 0,
  },
  { label: 'control border on footer tint', fg: 'border-control', bg: 'surface-footer', sizePx: 0 },
  {
    label: 'control border on subtle surface',
    fg: 'border-control',
    bg: 'surface-subtle',
    sizePx: 0,
  },
  { label: 'section rule on white', fg: 'accent', bg: 'background', sizePx: 0 },
  { label: 'section rule on process tint', fg: 'accent', bg: 'surface-tint-2', sizePx: 0 },
  { label: 'error border on white', fg: 'danger-500', bg: 'background', sizePx: 0 },
];

export interface MeasuredPairing {
  readonly label: string;
  readonly fg: string;
  readonly bg: string;
  /** Resolved hex, for rendering a swatch without re-reading the stylesheet. */
  readonly fgHex: string;
  readonly bgHex: string;
  readonly ratio: number;
  readonly required: number;
  /** `"13px"`, or `"non-text"` when `sizePx` is 0. */
  readonly size: string;
  readonly headroom: number;
  readonly passes: boolean;
}

/**
 * Resolves a token name to its hex value, failing loudly if it was renamed.
 *
 * Throwing rather than returning a placeholder. A missing token silently rendered as black would
 * make the preview show a passing ratio for a pairing that no longer exists.
 */
export function colorToken(name: string, tokens = readColorTokens()): string {
  const value = tokens.get(name);

  if (value === undefined) {
    throw new Error(
      `No colour token "${name}" in theme.css. If it was renamed, update pairings.ts - ` +
        `the pairing still needs proving.`,
    );
  }

  return value;
}

/**
 * Measures a list of pairings.
 *
 * `tokens` is threaded through rather than read per pairing, because `readColorTokens` re-reads and
 * re-parses the stylesheet on every call, and the preview measures forty of them per request.
 */
export function measurePairings(
  pairings: readonly Pairing[],
  tokens = readColorTokens(),
): readonly MeasuredPairing[] {
  return pairings.map(({ label, fg, bg, sizePx, bold = false }) => {
    const fgHex = colorToken(fg, tokens);
    const bgHex = colorToken(bg, tokens);
    const ratio = roundRatio(contrastRatio(fgHex, bgHex));

    // A `sizePx` of 0 means non-text, where the 3:1 floor comes from 1.4.11 rather than from a
    // size. `requiredRatio(0)` happens to return 4.5, so this cannot delegate to it.
    const required = sizePx === 0 ? 3 : requiredRatio(sizePx, bold);

    return {
      label,
      fg,
      bg,
      fgHex,
      bgHex,
      ratio,
      required,
      size: sizePx === 0 ? 'non-text' : `${String(sizePx)}px${bold ? ' bold' : ''}`,
      // Rounded, or binary floating point renders 0.01 as 0.009999999999999787 and the column
      // becomes unreadable in exactly the place it is meant to be read.
      headroom: Math.round((ratio - required) * 100) / 100,
      passes: ratio >= required,
    };
  });
}

/** Measures a pairing against an already-sampled colour, for the CTA band's gradient. */
export function measureAgainstSample(
  label: string,
  fg: string,
  sample: Rgb,
  sampleHex: string,
  tokens = readColorTokens(),
): MeasuredPairing {
  const fgHex = colorToken(fg, tokens);
  const ratio = roundRatio(contrastRatio(fgHex, sample));

  return {
    label,
    fg,
    bg: sampleHex,
    fgHex,
    bgHex: sampleHex,
    ratio,
    required: 4.5,
    size: '16px',
    headroom: Math.round((ratio - 4.5) * 100) / 100,
    passes: ratio >= 4.5,
  };
}
