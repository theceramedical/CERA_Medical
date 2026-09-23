import { cn } from './cn.ts';
import { VisuallyHidden } from './visually-hidden.tsx';

/**
 * An indeterminate progress indicator.
 *
 * Two things that are easy to get wrong:
 *
 * 1. **The SVG is `aria-hidden`, and the label is text.** A spinner conveys "waiting", which is
 *    not something a rotating shape communicates to a screen reader. The status is announced from
 *    a visually hidden string instead.
 * 2. **Motion still has to stop under `prefers-reduced-motion`.** A spinner is the one component
 *    where suppressing the animation removes the only signal that anything is happening, so the
 *    global rule in `theme.css` flattens the duration to 0.01ms and this keeps a static
 *    three-quarter arc - which still reads as "in progress" because it is visibly incomplete,
 *    unlike a full ring.
 */

export interface SpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg';
  /**
   * What is being waited for.
   *
   * Announced, not drawn. Defaults to something generic, but a caller that knows should say -
   * "Loading services" is materially more useful than "Loading" when several regions can be busy
   * at once.
   */
  readonly label?: string;
  /**
   * Whether this spinner announces on its own.
   *
   * `false` when it sits inside something that is already a live region - a loading `Button`
   * announces through its own `aria-busy`, and a second announcement from here would have the
   * screen reader say it twice.
   */
  readonly announce?: boolean;
  readonly className?: string;
}

const SIZE_CLASS = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
} as const;

export function Spinner({
  size = 'md',
  label = 'Loading',
  announce = true,
  className,
}: SpinnerProps) {
  return (
    <>
      <svg
        className={cn('animate-spin', SIZE_CLASS[size], className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* The faint full ring gives the arc something to travel against, so the shape reads as
            a circle rather than as a stray stroke. `currentColor` throughout, so the spinner
            inherits whatever the surrounding control already established. */}
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
        {/* A three-quarter arc. Incomplete on purpose: when the animation is suppressed this is
            still visibly a partial ring, which reads as unfinished work. */}
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {announce ? <VisuallyHidden role="status">{label}</VisuallyHidden> : null}
    </>
  );
}
