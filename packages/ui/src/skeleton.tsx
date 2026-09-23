import { cn } from './cn.ts';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { ReactNode } from 'react';

/**
 * Loading placeholders, per design-language.md section 5.11.
 *
 * `neutral-100` blocks with a pulse that the global `prefers-reduced-motion` rule in theme.css
 * flattens. `motion-reduce:animate-none` is also declared here rather than relying on that rule
 * alone: the global rule sets the duration to 0.01ms, which stops the movement but leaves the
 * animation in whatever state its first frame describes. Removing the animation outright is the
 * only way to guarantee the block settles at full opacity rather than mid-fade.
 */

export interface SkeletonProps {
  readonly className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      // `aria-hidden` because the shape means nothing. `SkeletonRegion` below is what does the
      // announcing - a screen reader reading out eight empty boxes is worse than silence.
      aria-hidden="true"
      className={cn(
        'block rounded-md bg-neutral-100',
        'animate-pulse motion-reduce:animate-none',
        className,
      )}
    />
  );
}

export interface SkeletonRegionProps {
  /** What is loading, in words: "Loading services". */
  readonly label: string;
  /** Set false once the real content has replaced the skeletons. */
  readonly loading: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Wraps a group of skeletons so the wait is announced once.
 *
 * `aria-busy` on a region with `aria-live="polite"` is the pairing that works: the region tells
 * assistive technology that its contents are in flux, and the polite live region delivers the
 * single "Loading services" rather than interrupting whatever the user is reading.
 *
 * The alternative - no announcement at all - leaves a screen reader user on a page that reports
 * itself as complete and empty, with no reason to wait.
 */
export function SkeletonRegion({ label, loading, className, children }: SkeletonRegionProps) {
  return (
    <div className={className} aria-busy={loading || undefined} aria-live="polite">
      {/* The message is in the DOM only while loading, so its appearance is the change the live
          region reports. A permanently present node that merely changes text is announced less
          reliably across screen readers. */}
      {loading ? <VisuallyHidden>{label}</VisuallyHidden> : null}
      {children}
    </div>
  );
}
