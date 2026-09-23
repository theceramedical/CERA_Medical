import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast, type ToastInput } from './toast.tsx';

import type { ReactNode } from 'react';

/**
 * The toast contract from design-language.md section 5.11.
 *
 * Fake timers, because the rule that matters most - an error never disappears on its own - can only
 * be demonstrated by advancing the clock well past every other toast's lifetime and showing the
 * error is still there.
 *
 * `fireEvent` rather than `userEvent`. `userEvent` awaits its own internal delays on real timers and
 * deadlocks against a faked clock unless it is handed an advance function, and the resulting setup
 * is more machinery than these assertions need: none of them depends on a realistic event sequence,
 * only on a click having happened.
 */

function Harness({
  toast,
  label = 'Raise',
}: {
  readonly toast: ToastInput;
  readonly label?: string;
}) {
  const { show } = useToast();

  return (
    <button
      type="button"
      onClick={() => {
        show(toast);
      }}
    >
      {label}
    </button>
  );
}

function renderWithProvider(ui: ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function raise(label = 'Raise') {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * The regions are persistent; the messages are what come and go.
   *
   * This is the single most common reason a toast implementation appears correct and is silent in
   * practice: a live region created at the same moment as its content is frequently not announced,
   * because the screen reader has to have been observing the node to notice it changed.
   *
   * These assertions are written against the *region*, not the message, and that distinction is the
   * whole fix. The earlier version of this file asserted `queryByRole('status')` disappeared when a
   * toast timed out - which passed against an implementation that destroyed the live region along with
   * its message, the exact bug. The browser accessibility run in WP-03.8 caught it.
   */
  it('renders both live regions before any message exists', () => {
    renderWithProvider(<Harness toast={{ tone: 'info', title: 'Hello' }} />);

    // Polite for confirmations, assertive for errors. One element cannot be both, so there are two,
    // and both have to pre-exist for either to be announced.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('keeps both live regions in the document after a message is dismissed', () => {
    renderWithProvider(<Harness toast={{ tone: 'success', title: 'Saved' }} />);
    raise();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Present and empty, ready for the next message. A region that is torn down and recreated per
    // message is a region that announces the first one and nothing after it.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('puts no live-region role on the message itself', () => {
    // A live region nested inside a live region gives some screen readers licence to announce the
    // message twice.
    renderWithProvider(<Harness toast={{ tone: 'danger', title: 'Could not submit' }} />);
    raise();

    expect(screen.getAllByRole('alert')).toHaveLength(1);

    // The nearest element carrying a role above the message text is the region itself, with nothing
    // in between.
    const title = screen.getByText('Could not submit');

    expect(title.closest('[role]')).toBe(screen.getByRole('alert'));
  });

  it('announces a success politely', () => {
    renderWithProvider(<Harness toast={{ tone: 'success', title: 'Enquiry received' }} />);
    raise();

    expect(screen.getByRole('status')).toHaveTextContent('Enquiry received');
  });

  it('announces an error assertively', () => {
    // `alert` interrupts whatever the screen reader was mid-sentence on; `status` waits for a pause.
    // An error is worth interrupting for, a confirmation is not.
    renderWithProvider(<Harness toast={{ tone: 'danger', title: 'Could not submit' }} />);
    raise();

    expect(screen.getByRole('alert')).toHaveTextContent('Could not submit');
  });

  it('dismisses a success on its own', () => {
    renderWithProvider(<Harness toast={{ tone: 'success', title: 'Saved' }} />);
    raise();

    expect(screen.getByText('Saved')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // The message goes, the region stays - so these assert on the text rather than on the role.
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('never dismisses an error on its own, even with a duration set', () => {
    /**
     * `duration` is ignored for the `danger` tone rather than merely defaulting differently, so a
     * call site cannot opt back in. WCAG 2.2 SC 2.2.1 requires a way to extend or dismiss timed
     * content, and losing "your enquiry was not submitted" costs the enquiry.
     */
    renderWithProvider(
      <Harness toast={{ tone: 'danger', title: 'Could not submit', duration: 1000 }} />,
    );
    raise();

    act(() => {
      vi.advanceTimersByTime(600_000);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Could not submit');
  });

  it('lets the user dismiss an error', () => {
    renderWithProvider(<Harness toast={{ tone: 'danger', title: 'Could not submit' }} />);
    raise();

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByText('Could not submit')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('names the dismiss button after the message it closes', () => {
    // In a stack of three toasts, three buttons all announced as "Dismiss" give the user no way to
    // tell which closes which.
    renderWithProvider(<Harness toast={{ tone: 'info', title: 'Draft saved' }} />);
    raise();

    expect(screen.getByRole('button', { name: 'Dismiss: Draft saved' })).toBeInTheDocument();
  });

  it('honours a custom duration for a non-error', () => {
    renderWithProvider(<Harness toast={{ tone: 'info', title: 'Copied', duration: 2000 }} />);
    raise();

    act(() => {
      vi.advanceTimersByTime(1999);
    });

    expect(screen.getByText('Copied')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });

  it('keeps two messages raised in the same tick distinct', () => {
    /**
     * The ids come from a monotonic counter rather than a timestamp: two toasts raised in the same
     * millisecond would collide, and React would then reuse one DOM node for both - so the second
     * message would replace the first instead of stacking under it.
     */
    function Pair() {
      const { show } = useToast();

      return (
        <button
          type="button"
          onClick={() => {
            show({ tone: 'info', title: 'First' });
            show({ tone: 'info', title: 'Second' });
          }}
        >
          Raise both
        </button>
      );
    }

    renderWithProvider(<Pair />);
    raise('Raise both');

    // Both messages inside the one polite region, rather than one replacing the other.
    expect(screen.getByRole('status')).toHaveTextContent('First');
    expect(screen.getByRole('status')).toHaveTextContent('Second');
    expect(screen.getAllByRole('button', { name: /^Dismiss:/ })).toHaveLength(2);
  });

  it('dismisses the right message when several are open', () => {
    renderWithProvider(
      <>
        <Harness toast={{ tone: 'info', title: 'First' }} label="Raise first" />
        <Harness toast={{ tone: 'info', title: 'Second' }} label="Raise second" />
      </>,
    );

    raise('Raise first');
    raise('Raise second');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss: First' }));

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('refuses to work outside the provider', () => {
    // The provider owns the live region, which has to be in the document before a message is added
    // to it. Silently rendering a toast with nowhere to announce it is the failure being prevented.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Harness toast={{ tone: 'info', title: 'Hello' }} />)).toThrow(
      /must be called inside <ToastProvider>/,
    );

    consoleError.mockRestore();
  });
});
