import { cn } from './cn.ts';

import type { ElementType } from 'react';

/** Full lock-up shipped with the public site (`apps/web/public/images`). */
export const CERA_LOGO_LOCKUP_SRC = '/images/cera-logo-lockup.png';

/**
 * The CERA Medical lock-up: official C + ERA / MEDICAL artwork (teal recoloured to site primary).
 *
 * Rendered as one image so the mark matches brand files in Vendure, CMS, and print. `CrossAndLeaf`
 * remains for favicon-sized crops and legacy references.
 */

export interface WordmarkProps {
  readonly as?: ElementType;
  readonly onDark?: boolean;
  readonly size?: 'sm' | 'md';
  readonly className?: string;
  /** Override lock-up path (defaults to {@link CERA_LOGO_LOCKUP_SRC}). */
  readonly logoSrc?: string;
}

export function Wordmark({
  as: Component = 'div',
  onDark = false,
  size = 'md',
  className,
  logoSrc = CERA_LOGO_LOCKUP_SRC,
}: WordmarkProps) {
  return (
    <Component className={cn('inline-flex items-center', className)}>
      <img
        src={logoSrc}
        alt="CERA Medical"
        width={size === 'sm' ? 140 : 168}
        height={size === 'sm' ? 57 : 68}
        decoding="async"
        className={cn(
          'h-auto w-auto max-w-none',
          size === 'sm' ? 'max-h-7' : 'max-h-9',
          onDark && 'brightness-0 invert',
        )}
      />
    </Component>
  );
}

export interface CrossAndLeafProps {
  readonly className?: string;
}

/**
 * Legacy mark (cross + leaf). Prefer the full {@link Wordmark} lock-up on the public site.
 */
export function CrossAndLeaf({ className }: CrossAndLeafProps) {
  return (
    <svg viewBox="0 0 40 40" focusable="false" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M15.5 4h9a2 2 0 0 1 2 2v9.5H36a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9.5V38a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9.5H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9.5V6a2 2 0 0 1 2-2Z"
        opacity="0.18"
      />
      <path
        fill="currentColor"
        d="M16.75 7h6.5a1 1 0 0 1 1 1v9.75H34a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-9.75V36a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-9.75H6a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1h9.75V8a1 1 0 0 1 1-1Z"
      />
      <path
        fill="currentColor"
        d="M26 14.5c0-5.25 3.9-9.7 9.4-11.4.7-.2 1.4.4 1.3 1.1-.7 6-4.2 10.3-9.1 11.6a1 1 0 0 1-1.2-.7 5.6 5.6 0 0 1-.4-.6Z"
      />
      <path
        fill="currentColor"
        opacity="0.55"
        d="M27.4 15.3c1.4-3.7 4-6.6 7.4-8.2.5-.2 1 .4.6.8-2.6 2.4-4.6 5-6 8a.8.8 0 0 1-1.5-.6Z"
      />
    </svg>
  );
}
