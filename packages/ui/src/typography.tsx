import { cn } from './cn.ts';

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

/**
 * Typography primitives.
 *
 * The reason these exist rather than letting components write `className="text-h2"` directly
 * is the separation of *level* from *size*. Heading level is document structure: a screen
 * reader user navigates by it, and skipping from `h2` to `h4` reads as a missing section.
 * Size is appearance. They agree most of the time, which is exactly why the one case where
 * they must not - a visually small heading that is still the section's `h2` - gets silently
 * broken when a component picks an element to get a size.
 *
 * So `Heading` takes `level` and `size` separately, and defaults `size` from `level` so the
 * common case stays short.
 */

/** Every step in the scale, from design-language.md section 2.1. */
export type TypeScale =
  | 'display-1'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body-lg'
  | 'body'
  | 'body-sm'
  | 'caption'
  | 'eyebrow'
  | 'pill'
  | 'button';

/**
 * Scale step to utility class.
 *
 * A lookup rather than a template literal. `text-${size}` would compile, but Tailwind scans
 * source for complete class strings and finds nothing to generate, so every one of these
 * would be missing from the stylesheet - and the component would render unstyled while every
 * unit test passed.
 */
const SCALE_CLASS: Record<TypeScale, string> = {
  'display-1': 'text-display-1',
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  'body-lg': 'text-body-lg',
  body: 'text-body',
  'body-sm': 'text-body-sm',
  caption: 'text-caption',
  eyebrow: 'text-eyebrow',
  pill: 'text-pill',
  button: 'text-button',
};

/** Semantic ink colours available to text. */
export type TextTone = 'default' | 'heading' | 'muted' | 'primary' | 'accent' | 'on-dark';

const TONE_CLASS: Record<TextTone, string> = {
  default: 'text-copy',
  heading: 'text-foreground',
  muted: 'text-muted',
  primary: 'text-primary',
  accent: 'text-accent-hover',
  'on-dark': 'text-on-primary',
};

/**
 * `eyebrow` and `pill` are uppercase in the reference.
 *
 * Applied with `uppercase` rather than by writing the copy in capitals, because capitalised
 * source text is read out letter by letter by some screen readers, and it cannot be
 * lowercased again for a context that needs it.
 */
const UPPERCASE_SCALES = new Set<TypeScale>(['eyebrow', 'pill']);

export function scaleClasses(size: TypeScale, tone: TextTone = 'default'): string {
  return cn(SCALE_CLASS[size], TONE_CLASS[tone], UPPERCASE_SCALES.has(size) && 'uppercase');
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The size a heading takes when the caller does not say otherwise. */
const DEFAULT_SIZE_FOR_LEVEL: Record<HeadingLevel, TypeScale> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h4',
  6: 'h4',
};

export interface HeadingProps extends Omit<ComponentPropsWithoutRef<'h2'>, 'color'> {
  /** Document structure. Chosen by position in the page outline, never by desired size. */
  readonly level: HeadingLevel;
  /** Appearance. Defaults from `level`; set it only when the two genuinely differ. */
  readonly size?: TypeScale;
  readonly tone?: TextTone;
  readonly children: ReactNode;
}

/**
 * A heading whose level and size are independent.
 *
 * `display-1` is a size, not a level: the hero headline is `<Heading level={1}
 * size="display-1">`, which keeps exactly one `h1` on the page while letting it render larger
 * than a default `h1`.
 */
export function Heading({ level, size, tone = 'heading', className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as ElementType;

  return (
    <Tag
      className={cn(scaleClasses(size ?? DEFAULT_SIZE_FOR_LEVEL[level], tone), className)}
      {...rest}
    />
  );
}

/** Elements `Text` is allowed to render as. Restricted to what is semantically sensible. */
export type TextElement = 'p' | 'span' | 'div' | 'dd' | 'dt' | 'li' | 'figcaption' | 'strong';

export interface TextProps extends Omit<ComponentPropsWithoutRef<'p'>, 'color'> {
  readonly as?: TextElement;
  readonly size?: TypeScale;
  readonly tone?: TextTone;
  /** Caps the line length. Long measures are hard to track back from at the line end. */
  readonly measure?: boolean;
  readonly children: ReactNode;
}

export function Text({
  as = 'p',
  size = 'body',
  tone = 'default',
  measure = false,
  className,
  ...rest
}: TextProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      className={cn(scaleClasses(size, tone), measure && 'max-w-measure', className)}
      {...rest}
    />
  );
}
