import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './cn.ts';

import type { ReactNode } from 'react';

/**
 * The tinted circle behind a line icon: 48px on a ServiceCard, 56px white with a shadow on a
 * ProcessStep (design-language.md sections 5.2 and 5.3).
 *
 * `aria-hidden` on the wrapper, unconditionally and with no prop to override it. The disc is
 * decoration, and every icon this design puts inside one sits beside a real text label - so an
 * accessible name here would only ever duplicate the words underneath it. Making it configurable
 * would invite an `IconDisc` used as the sole content of a button, which is the case the wrapper
 * cannot make accessible on its own.
 */

const iconDiscVariants = cva('inline-flex shrink-0 items-center justify-center rounded-pill', {
  variants: {
    tone: {
      /** ServiceCard: the sampled `icon-disc` tint with a primary-700 glyph. */
      tint: 'bg-icon-disc text-primary',
      /** ProcessStep: white with `shadow-sm`, because it sits on the tinted process band. */
      raised: 'bg-surface text-primary shadow-sm',
      /** Hero badge card and EmptyState. */
      accent: 'bg-teal-50 text-accent-hover',
    },
    size: {
      sm: 'size-10',
      md: 'size-12',
      lg: 'size-14',
    },
  },
  defaultVariants: { tone: 'tint', size: 'md' },
});

export interface IconDiscProps extends VariantProps<typeof iconDiscVariants> {
  readonly className?: string;
  readonly children: ReactNode;
}

export function IconDisc({ tone, size, className, children }: IconDiscProps) {
  return (
    <span aria-hidden="true" className={cn(iconDiscVariants({ tone, size }), className)}>
      {children}
    </span>
  );
}

export { iconDiscVariants };
