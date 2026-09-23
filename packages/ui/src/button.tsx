import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './cn.ts';
import { Spinner } from './spinner.tsx';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Button, per design-language.md section 5.1.
 *
 * The variants and sizes come straight from the reference image. The parts that the reference
 * cannot express, and that are therefore easiest to lose, are the loading and disabled
 * behaviours - both handled here so no call site has to remember them.
 */

const buttonVariants = cva(
  cn(
    // `inline-flex` with `items-center` so an icon and a label share a baseline-ish centre without
    // the label shifting when the icon is absent.
    'relative inline-flex items-center justify-center gap-2 rounded-md',
    'text-button whitespace-nowrap',
    'transition-colors duration-base ease-standard',

    // The arrow glyph shifts on hover. Scoped to a group so the icon moves and the label does
    // not, which is the effect in the reference.
    'group',

    /**
     * Disabled styling lives here rather than per variant, because it has to override the
     * variant's own fill - and `disabled:` must win regardless of which variant is applied.
     *
     * `neutral-200` on `neutral-500` measures 2.4:1 for the label, which is deliberately below
     * the 4.5:1 text threshold: disabled text is exempt from 1.4.3, and making it pass would make
     * it indistinguishable from an enabled control. The fill against the page still reads as a
     * shape, so the control is visibly present but visibly unavailable - the failure to avoid is
     * a disabled control that has faded out entirely, because the user cannot tell it apart from
     * one that failed to render.
     */
    'disabled:cursor-not-allowed disabled:border-transparent',
    'disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none',
  ),
  {
    variants: {
      variant: {
        /** Explore Services, Read More, Subscribe. */
        primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active',
        /**
         * Header "Make an Enquiry". Fills with `accent-fill` (teal-700), not the sampled
         * teal-600: white on teal-600 measures 3.42:1, which fails AA for a 15px label. See
         * design-language.md section 1.4.
         */
        accent: 'bg-accent-fill text-on-accent hover:bg-teal-800 active:bg-teal-900',
        /**
         * Hero "Make an Enquiry". The border is `border-control` (neutral-500) rather than the
         * sampled hairline, because the border *is* the control boundary here and 1.4.11 requires
         * 3:1 - the sampled neutral-300 measures 1.54:1.
         */
        outline:
          'border border-border-control bg-surface text-foreground hover:bg-surface-subtle active:bg-neutral-100',
        /** "View All Services", "View All Articles". */
        ghost: 'text-primary hover:bg-primary-50 active:bg-primary-100',
        /** CTA band, where the surroundings are a dark gradient. */
        'on-dark': 'bg-neutral-0 text-primary hover:bg-primary-50 active:bg-primary-100',
      },

      /**
       * Heights from the reference: 36 / 44 / 48px.
       *
       * `sm` is below the 44px touch target the design contract requires, so it carries a hit-area
       * expansion rather than being quietly non-compliant - see `HIT_AREA_EXPANSION`.
       */
      size: {
        sm: 'h-9 px-5',
        md: 'h-11 px-6',
        lg: 'h-12 px-6',
      },

      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

/**
 * Extends a 36px control to a 44px pointer target without changing its appearance.
 *
 * WCAG 2.2 SC 2.5.8 sets 24x24 as the AA floor and 2.5.5 sets 44x44 as AAA;
 * design-language.md section 5.1 commits to 44 for anything touch-reachable. A 36px button meets
 * neither on its own.
 *
 * The overlay expands **vertically only**. Horizontal expansion would overlap the neighbour in a
 * button row - two adjacent targets whose hit areas cross is worse than one that is slightly
 * small, because the resulting mis-tap activates the wrong action rather than nothing. Vertical
 * growth is safe because buttons in this design sit side by side, not stacked tightly.
 */
const HIT_AREA_EXPANSION =
  'after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[""]';

export interface ButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'color'>, VariantProps<typeof buttonVariants> {
  /**
   * An icon rendered before the label.
   *
   * Always `aria-hidden` at the icon's own level - see `IconWrapper`. An icon that duplicates the
   * label adds an announcement with no information.
   */
  readonly iconStart?: ReactNode;
  /** An icon rendered after the label. The `→` in the reference's buttons. */
  readonly iconEnd?: ReactNode;
  /**
   * Whether the button is waiting on something.
   *
   * Sets `aria-busy`, disables activation, and swaps the leading icon for a spinner while keeping
   * the label. Keeping the label is the point: swapping it for "Loading…" changes the button's
   * accessible name mid-interaction, which a screen reader reports as a different control
   * appearing, and it also changes the button's width - so the layout jumps and a second click
   * lands somewhere else.
   */
  readonly loading?: boolean;
  /** What to announce while loading, if the label alone is not clear. */
  readonly loadingLabel?: string;
  readonly children: ReactNode;
}

export function Button({
  variant,
  size = 'md',
  fullWidth,
  iconStart,
  iconEnd,
  loading = false,
  loadingLabel,
  disabled,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  /**
   * `type` defaults to `button`, not `submit`.
   *
   * HTML's default is `submit`, which means any button placed inside a form submits it. That is
   * almost never what a "Clear filters" or disclosure toggle intends, and the bug it produces - a
   * full page reload on an unrelated click - is confusing enough to be worth defaulting away
   * from. A submit button says so explicitly.
   */
  const isInoperable = disabled === true || loading;

  return (
    <button
      type={type}
      className={cn(
        buttonVariants({ variant, size, fullWidth }),
        size === 'sm' && HIT_AREA_EXPANSION,
        className,
      )}
      // Disabled while loading, so a second click cannot double-submit. `disabled` rather than
      // `aria-disabled`: this button genuinely must not be activated, and `aria-disabled` alone
      // leaves it clickable.
      disabled={isInoperable}
      // Announces the state change in place, which is what lets the label stay put.
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} announce={false} label={loadingLabel ?? ''} />
      ) : (
        <IconWrapper>{iconStart}</IconWrapper>
      )}

      {children}

      {/* Moves 2px on hover, per the reference. `motion-reduce` is belt and braces: the global
          rule in theme.css already flattens the duration, and this also drops the translation so
          nothing shifts even instantaneously. */}
      <IconWrapper className="transition-transform duration-base ease-standard group-hover:translate-x-0.5 motion-reduce:transform-none">
        {iconEnd}
      </IconWrapper>
    </button>
  );
}

/**
 * Hides a decorative icon from assistive technology and stops it shrinking.
 *
 * `aria-hidden` on a wrapper rather than trusting each icon to set it: the icons come from
 * `lucide-react`, whose components do set `aria-hidden` by default, but a caller can pass any
 * node - including an inline SVG from somewhere else - and the guarantee should not depend on
 * what was passed.
 *
 * `shrink-0` matters because the label is `whitespace-nowrap`; without it, flex would compress
 * the icon rather than the text when a button is narrower than its content.
 */
function IconWrapper({
  children,
  className,
}: {
  readonly children?: ReactNode;
  readonly className?: string;
}) {
  if (children === undefined || children === null || children === false) return null;

  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center', className)}>
      {children}
    </span>
  );
}

export { buttonVariants };
