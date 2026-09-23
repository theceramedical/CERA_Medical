import { cn } from './cn.ts';
import { visuallyHiddenClasses } from './visually-hidden.tsx';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * A data table for the staff enquiry queue and the customer portal timeline.
 *
 * Three things here are not optional, and all three are invisible in a screenshot.
 *
 * **A `<caption>`.** It is the table's accessible name. Without it a screen reader announces "table,
 * 6 columns, 20 rows" with no indication of what the rows are. A heading above the table does not
 * serve: nothing associates the two. `caption` is a required prop for that reason, with
 * `captionHidden` for the case where a visible heading already says it - the caption still exists in
 * the accessibility tree, it is just not painted twice.
 *
 * **Scoped headers.** `scope="col"` on a `<th>` in the head, `scope="row"` on the leading cell of
 * each row. This is what lets a screen reader say "Status, Under review" when the user moves to a
 * cell, instead of reading "Under review" with no column context - and in a queue of enquiries,
 * a bare status with no reference number is useless.
 *
 * **A keyboard-reachable scroll container.** A table wider than its viewport needs to scroll, and a
 * `div` with `overflow-x: auto` can be scrolled by mouse or touch but not by keyboard, because it
 * is not focusable. `tabindex="0"` plus a `role="region"` with a name makes it a landmark the user
 * can tab to and then scroll with the arrow keys. This is WCAG 2.1.1, and it is the single most
 * commonly missed part of a responsive table.
 */

export interface TableProps extends Omit<ComponentPropsWithoutRef<'table'>, 'className'> {
  /** The table's accessible name. Required. */
  readonly caption: ReactNode;
  /** Hides the caption visually while keeping it in the accessibility tree. */
  readonly captionHidden?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Table({
  caption,
  captionHidden = false,
  className,
  children,
  ...rest
}: TableProps) {
  return (
    <div
      role="region"
      /**
       * `tabindex="0"` only alongside a `role` and a name. A focusable div with no role is a tab
       * stop that announces nothing, which is its own failure - the user tabs to an element and
       * hears silence.
       *
       * `aria-label` rather than `aria-labelledby` pointing at the caption: the caption is inside
       * this region, and a region labelled by its own content is announced twice.
       *
       * The rule below exists to stop `tabIndex` being sprinkled on divs that do nothing, and its
       * allow-list covers `tabpanel` but not `region`. A scrollable region is the one case where a
       * non-interactive element must be focusable: keyboard users cannot scroll a container they
       * cannot focus, which is WCAG 2.1.1. Disabled here with the role and the name both present,
       * which is what makes the tab stop meaningful rather than silent.
       */
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label={typeof caption === 'string' ? `${caption}, scrollable` : 'Table, scrollable'}
      className={cn(
        /**
         * `min-w-0` is what makes `overflow-x-auto` work at all.
         *
         * A flex or grid item defaults to `min-width: auto`, which refuses to shrink below its
         * content's minimum width. The scroll container therefore grew to the table's intrinsic width
         * and pushed the whole document wider instead of scrolling - a SC 1.4.10 reflow failure that
         * looked exactly like a correct implementation in the source, and only appeared inside a flex
         * parent. Found at a 320px viewport by the reflow check in WP-03.8.
         */
        /**
         * `relative` makes this a containing block, which is what confines the overflow.
         *
         * Without it, an absolutely positioned descendant resolves against the initial containing
         * block instead of against this element, and so escapes the scroll container's clip entirely -
         * contributing to the *document's* scrollable width. The descendants in question are the
         * visually hidden spans inside cells (`Badge srPrefix`, and `caption` when hidden), which are
         * 1px and invisible, so the symptom was a page that scrolled sideways by forty-odd pixels with
         * nothing visible out there to explain it.
         *
         * The general rule this encodes: a scroll container has to establish a containing block, or it
         * does not actually contain anything. That is a property of the scroller rather than of the
         * hidden text, which is why the fix lives here and not in `visually-hidden.tsx`.
         */
        'relative min-w-0 overflow-x-auto rounded-lg border border-border',
        // The scroll container is a tab stop, so it needs a visible focus indicator like any other.
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        className,
      )}
    >
      <table className="w-full border-collapse text-left text-body-sm" {...rest}>
        <caption
          className={cn(
            captionHidden
              ? visuallyHiddenClasses
              : 'border-b border-border px-4 py-3 text-left text-body font-semibold text-foreground',
          )}
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { readonly children: ReactNode }) {
  return <thead className="bg-surface-subtle">{children}</thead>;
}

export function TableBody({ children }: { readonly children: ReactNode }) {
  // `divide-y` rather than a border on every cell: a grid of lines competes with the data, and the
  // reference's tables are separated by row only.
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TableRow({ children }: { readonly children: ReactNode }) {
  return <tr>{children}</tr>;
}

export interface TableHeaderCellProps extends ComponentPropsWithoutRef<'th'> {
  /**
   * `col` for a column heading, `row` for the leading cell of a data row.
   *
   * Required rather than defaulted, because the default that would be right most of the time
   * (`col`) is silently wrong on every row header - and a row header with the wrong scope makes
   * the whole row's announcements lose their subject.
   */
  readonly scope: 'col' | 'row';
}

export function TableHeaderCell({ scope, className, children, ...rest }: TableHeaderCellProps) {
  return (
    <th
      scope={scope}
      className={cn(
        'px-4 py-3 font-semibold text-foreground',
        scope === 'col' && 'text-caption uppercase tracking-wide text-muted',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...rest }: ComponentPropsWithoutRef<'td'>) {
  return (
    <td className={cn('px-4 py-3 align-top text-copy', className)} {...rest}>
      {children}
    </td>
  );
}
