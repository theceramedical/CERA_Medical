import { cn } from './cn.ts';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { LucideIcon } from 'lucide-react';

/**
 * The single entry point for a line icon.
 *
 * `lucide-react` is the only icon set (design-language.md section 7). Everything goes through this
 * wrapper rather than rendering the lucide component directly, for three reasons that are each a
 * defect waiting to happen:
 *
 *   1. **Hidden by default.** An icon beside a text label adds no information, and announcing it
 *      turns "Explore services" into "arrow right, Explore services". The default here is
 *      `aria-hidden`, and giving the icon a name is the thing you have to ask for - not the thing
 *      you have to remember.
 *   2. **Sizes on the 4px scale.** `size-4` / `size-5` / `size-6` and nothing in between, so icons
 *      cannot drift to 22px because that happened to look right in one card.
 *   3. **`currentColor`, always.** lucide defaults to `currentColor` for its stroke, and this keeps
 *      it that way. An icon with its own colour would need its own contrast pairing, and it would
 *      be invisible in forced-colours mode, where only `currentColor` follows the system palette.
 *
 * Icons are drawn from the current text colour and inherit it, which is why there is no `tone` prop:
 * the surrounding text already decided.
 */

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * 16 / 20 / 24 / 32px.
 *
 * A lookup rather than a computed `size-${n}`, because Tailwind scans source for complete class
 * strings and would generate none of these from an interpolation - leaving every icon at its
 * intrinsic 24px with no error anywhere.
 */
const SIZE_CLASS: Record<IconSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-8',
};

export interface IconProps {
  /** A lucide component, e.g. `ChevronRight`. */
  readonly icon: LucideIcon;
  readonly size?: IconSize;
  /**
   * An accessible name.
   *
   * Set this **only** when the icon is the entire content of a control and nothing else names it -
   * a social link in the footer, say. If there is a visible text label, leave it off: a name here
   * duplicates the label.
   *
   * The name is rendered as visually hidden text rather than `aria-label` on the `<svg>`. `aria-label`
   * on an SVG is honoured inconsistently - some engines ignore it unless the element also has
   * `role="img"` - and hidden text is announced by everything.
   */
  readonly label?: string;
  readonly className?: string;
}

export function Icon({ icon: Glyph, size = 'md', label, className }: IconProps) {
  return (
    <>
      <Glyph
        aria-hidden="true"
        // `shrink-0` because icons overwhelmingly sit in flex rows next to text. Without it, flex
        // compresses the icon rather than wrapping the label, and a 20px glyph becomes an 11px
        // smear at narrow widths.
        className={cn('shrink-0', SIZE_CLASS[size], className)}
      />
      {label === undefined ? null : <VisuallyHidden>{label}</VisuallyHidden>}
    </>
  );
}

export { SIZE_CLASS as ICON_SIZE_CLASS };
