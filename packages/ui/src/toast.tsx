'use client';

import { CircleCheckBig, CircleX, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from './cn.ts';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { ReactNode } from 'react';

/**
 * Transient notifications, per design-language.md section 5.11: bottom-right, `role="status"` for
 * success and `role="alert"` for error, dismissible, never auto-dismissing an error.
 *
 * Three decisions in here are accessibility requirements rather than preferences.
 *
 * **The live region exists before the message does.** `ToastProvider` renders an empty region on
 * mount and messages are inserted into it. A live region created at the same moment as its content
 * is frequently not announced at all - the screen reader has to have been observing the node to
 * notice it changed. This is the single most common reason a toast implementation appears to work
 * and is silent in practice.
 *
 * **An error never disappears on a timer.** A toast that vanishes after four seconds is unreadable
 * to anyone who reads slowly, is using magnification and was looking elsewhere, or is navigating by
 * keyboard and has not reached it - and WCAG 2.2 SC 2.2.1 requires a way to extend or dismiss
 * timed content. Success messages are allowed to auto-dismiss because losing one costs nothing;
 * losing "your enquiry was not submitted" costs the enquiry. `duration` is ignored for the `danger`
 * tone rather than merely defaulting differently, so a call site cannot opt back in.
 *
 * **The dismiss button has a real name.** An icon-only close control with no accessible name is
 * announced as "button", which in a stack of three toasts gives the user three identical buttons.
 */

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastMessage {
  readonly id: string;
  readonly tone: ToastTone;
  readonly title: string;
  readonly description?: string;
  /**
   * Milliseconds before automatic dismissal. Ignored entirely when `tone` is `danger`.
   *
   * The default is 6000 rather than the more common 3000-4000: 6 seconds is roughly what it takes
   * to notice a change at the edge of vision, move attention there, and read a sentence.
   */
  readonly duration?: number;
}

/** A message without its id, which the provider assigns. */
export type ToastInput = Omit<ToastMessage, 'id'>;

interface ToastContextValue {
  readonly toasts: readonly ToastMessage[];
  readonly show: (toast: ToastInput) => string;
  readonly dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 6000;

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (context === null) {
    throw new Error(
      'useToast must be called inside <ToastProvider>. The provider owns the live region, which ' +
        'has to be in the document before a message is added to it or the message is not announced.',
    );
  }

  return context;
}

export interface ToastProviderProps {
  readonly children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<readonly ToastMessage[]>([]);
  const counter = useRef(0);
  const idPrefix = useId();

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      // A monotonic counter, not `Math.random()` or `Date.now()`: two toasts raised in the same
      // tick would collide on a timestamp, and React would then reuse one DOM node for both.
      counter.current += 1;
      const id = `${idPrefix}-toast-${String(counter.current)}`;

      setToasts((current) => [...current, { ...input, id }]);

      return id;
    },
    [idPrefix],
  );

  const value = useMemo(() => ({ toasts, show, dismiss }), [toasts, show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastRegion({
  toasts,
  onDismiss,
}: {
  readonly toasts: readonly ToastMessage[];
  readonly onDismiss: (id: string) => void;
}) {
  return (
    /**
     * Rendered unconditionally, even when empty - see the note at the top of the file.
     *
     * `pointer-events-none` on the container with `pointer-events-auto` on each toast, so the empty
     * region does not sit invisibly over the bottom-right corner of the page swallowing clicks on
     * whatever is underneath it.
     */
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-2 p-4',
        'sm:inset-x-auto sm:right-0',
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const TONE_ICON: Record<ToastTone, LucideIcon> = {
  info: Info,
  success: CircleCheckBig,
  warning: TriangleAlert,
  danger: CircleX,
};

const TONE_CLASS: Record<ToastTone, string> = {
  info: 'border-primary-200 text-primary-900',
  success: 'border-success-500/40 text-success-700',
  warning: 'border-warning-500/40 text-warning-700',
  danger: 'border-danger-500/40 text-danger-700',
};

export function Toast({
  toast,
  onDismiss,
}: {
  readonly toast: ToastMessage;
  readonly onDismiss: (id: string) => void;
}) {
  const { id, tone, title, description, duration } = toast;
  const Icon = TONE_ICON[tone];

  useEffect(() => {
    // An error stays until dismissed. Returning early rather than passing `Infinity` to a timer,
    // so there is no timer to be got wrong.
    if (tone === 'danger') return undefined;

    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration ?? DEFAULT_DURATION);

    return () => {
      clearTimeout(timer);
    };
  }, [id, tone, duration, onDismiss]);

  return (
    <div
      /**
       * `alert` is assertive and interrupts; `status` is polite and waits. An error is worth
       * interrupting for, a confirmation is not.
       */
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-surface p-4 shadow-lg',
        TONE_CLASS[tone],
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />

      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body-sm font-semibold">{title}</p>
        {description === undefined ? null : <p className="text-caption text-copy">{description}</p>}
      </div>

      <button
        type="button"
        onClick={() => {
          onDismiss(id);
        }}
        // 44px target on a 20px glyph, via padding and a negative margin so the button's box does
        // not push the text column narrower than it needs to be.
        className={cn(
          '-m-2 ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-md p-2',
          'text-muted transition-colors duration-fast ease-standard hover:bg-surface-subtle hover:text-copy',
        )}
      >
        {/* The name includes the title, so a stack of toasts does not present three identical
            "Dismiss" buttons with no way to tell which closes which. */}
        <X className="size-5" aria-hidden="true" />
        <VisuallyHidden>{`Dismiss: ${title}`}</VisuallyHidden>
      </button>
    </div>
  );
}
