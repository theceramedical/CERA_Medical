import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The design system's font-size steps, from design-language.md section 2.1.
 *
 * Written out rather than read from `theme.css` because this module runs in the browser, in
 * client components, where there is no filesystem. `styles/theme.test.ts` asserts these lists
 * against the stylesheet, so the duplication cannot drift silently.
 */
export const FONT_SIZE_TOKENS = [
  'display-1',
  'h1',
  'h2',
  'h3',
  'h4',
  'body-lg',
  'body',
  'body-sm',
  'caption',
  'eyebrow',
  'pill',
  'button',
] as const;

/** The semantic colour tokens that can appear as `text-*`, `bg-*`, or `border-*`. */
export const COLOR_TOKENS = [
  'background',
  'surface',
  'surface-subtle',
  'surface-tint',
  'surface-tint-2',
  'surface-footer',
  'icon-disc',
  'foreground',
  'copy',
  'muted',
  'muted-large',
  'border',
  'border-strong',
  'border-control',
  'primary',
  'primary-hover',
  'primary-active',
  'accent',
  'accent-hover',
  'accent-fill',
  'on-primary',
  'on-accent',
  'focus-ring',
  'gradient-from',
  'gradient-to',
] as const;

/**
 * `tailwind-merge`, taught this design system's token names.
 *
 * The configuration is not optional polish - without it the library actively breaks
 * components, and it does so silently.
 *
 * Tailwind generates `text-*` utilities from two unrelated namespaces: font size and colour.
 * `tailwind-merge` resolves conflicts by class group, and it recognises the *stock* Tailwind
 * names - so it knows `text-sm` is a size and `text-red-500` is a colour. It knows nothing
 * about `text-button` or `text-copy`. Faced with both it assumes they are the same group,
 * decides the later one wins, and drops the earlier:
 *
 *     cn('text-button', 'text-copy')  ->  'text-copy'
 *
 * The font size is gone. Every button in the application would render at the inherited size,
 * every caption at 16px, and nothing anywhere would report a problem - the class list looks
 * plausible and the page merely looks slightly wrong. This was caught by a unit test asserting
 * that `scaleClasses('button')` still contains `text-button`, which is the only reason it is
 * not in the built output.
 *
 * Declaring both groups lets the library tell them apart, so a size and a colour coexist while
 * two sizes still resolve to the last one.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...FONT_SIZE_TOKENS] }],
      'text-color': [{ text: [...COLOR_TOKENS] }],
      'bg-color': [{ bg: [...COLOR_TOKENS] }],
      'border-color': [{ border: [...COLOR_TOKENS] }],
      'ring-color': [{ ring: [...COLOR_TOKENS] }],
      'outline-color': [{ outline: [...COLOR_TOKENS] }],
    },
  },
});

/**
 * Joins class names and resolves Tailwind conflicts, last one winning.
 *
 * `clsx` handles the conditional forms. `twMerge` is the part that matters: without it,
 * `cn('px-4', className)` where the caller passes `px-6` emits both, and which one applies
 * depends on their order in the generated stylesheet rather than on the call - so a
 * component's own default silently beats the override at one breakpoint and loses at another.
 *
 * Every component in this package composes its classes through here, which is what makes
 * `className` a reliable escape hatch rather than a coin flip.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
