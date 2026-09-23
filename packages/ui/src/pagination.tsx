import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from './cn.ts';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { ElementType } from 'react';

/**
 * Page navigation for the article index, per design-language.md section 5.11.
 *
 * `<nav aria-label="Pagination">` with `aria-current="page"` on the active page. Both matter for
 * the same reason: a row of numbers is meaningless without them. A screen reader reads
 * "1 2 3 4 5" as five links with no indication of which page is being shown, and the visual cue -
 * a filled square around the current number - is exactly the colour-only signal SC 1.4.1 rules
 * out. `aria-current` is the text equivalent.
 *
 * Each link's accessible name is "Page 3", not "3", because a link list built from this component
 * would otherwise be a column of bare digits.
 */

export interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  /** Builds the href for a page. Keeps this component unaware of the route shape. */
  readonly hrefForPage: (page: number) => string;
  readonly linkAs?: ElementType;
  readonly className?: string;
}

/** How many numbered links to show around the current page before collapsing to an ellipsis. */
const WINDOW = 1;

export function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
  linkAs: Link = 'a',
  className,
}: PaginationProps) {
  // One page is not pagination. Rendering an empty nav leaves a labelled landmark containing
  // nothing, which is a dead end in a landmark list.
  if (totalPages <= 1) return null;

  const pages = pageList(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          <Step
            direction="previous"
            page={currentPage - 1}
            disabled={currentPage <= 1}
            hrefForPage={hrefForPage}
            linkAs={Link}
          />
        </li>

        {pages.map((page, index) =>
          page === null ? (
            /**
             * The gap is decorative: the numbers either side already say pages were skipped. A
             * `<li>` is still required because `<ul>` may only contain list items, and
             * `aria-hidden` on it keeps "ellipsis" out of the announcement while leaving the item
             * count honest.
             */
            <li key={`gap-${String(index)}`} aria-hidden="true" className="px-2 text-muted">
              &hellip;
            </li>
          ) : (
            <li key={page}>
              <PageLink
                page={page}
                isCurrent={page === currentPage}
                hrefForPage={hrefForPage}
                linkAs={Link}
              />
            </li>
          ),
        )}

        <li>
          <Step
            direction="next"
            page={currentPage + 1}
            disabled={currentPage >= totalPages}
            hrefForPage={hrefForPage}
            linkAs={Link}
          />
        </li>
      </ul>
    </nav>
  );
}

/**
 * The visible page numbers, with `null` standing for a collapsed run.
 *
 * Always shows the first and last page plus a window around the current one, so the two ends of a
 * long list stay reachable in one click.
 */
export function pageList(currentPage: number, totalPages: number): readonly (number | null)[] {
  const shown = new Set<number>([1, totalPages]);

  for (let page = currentPage - WINDOW; page <= currentPage + WINDOW; page += 1) {
    if (page >= 1 && page <= totalPages) shown.add(page);
  }

  const sorted = [...shown].sort((a, b) => a - b);
  const result: (number | null)[] = [];

  for (const [index, page] of sorted.entries()) {
    const previous = sorted[index - 1];

    // A gap of exactly one page is filled rather than collapsed: "1 … 3" is the same width as
    // "1 2 3" and hides a page for no benefit.
    if (previous !== undefined && page - previous === 2) result.push(previous + 1);
    else if (previous !== undefined && page - previous > 2) result.push(null);

    result.push(page);
  }

  return result;
}

/** 44px square, so the target meets the touch minimum without the digit looking oversized. */
const CELL = cn(
  'inline-flex size-11 items-center justify-center rounded-md text-body-sm',
  'transition-colors duration-fast ease-standard',
);

function PageLink({
  page,
  isCurrent,
  hrefForPage,
  linkAs: Link,
}: {
  readonly page: number;
  readonly isCurrent: boolean;
  readonly hrefForPage: (page: number) => string;
  readonly linkAs: ElementType;
}) {
  if (isCurrent) {
    /**
     * Rendered as a `<span>`, not a link. Following a link to the page already displayed does
     * nothing, and a focusable control that does nothing is worse than one that is absent.
     */
    return (
      <span aria-current="page" className={cn(CELL, 'bg-primary font-semibold text-on-primary')}>
        <PageNumber page={page} />
      </span>
    );
  }

  return (
    <Link href={hrefForPage(page)} className={cn(CELL, 'text-copy hover:bg-primary-50')}>
      <PageNumber page={page} />
    </Link>
  );
}

/**
 * The digit, plus the word that makes it a sentence.
 *
 * The obvious construction - a visually hidden "Page " followed by the digit - produces the
 * accessible name "Page2". Accessible-name computation concatenates the text of child nodes and
 * then trims, and there is no whitespace text node between the hidden span and the number to
 * survive that, so the trailing space inside the span is discarded. The whole string therefore has
 * to live in one text node, with the visible digit rendered separately and hidden.
 *
 * WCAG 2.2 SC 2.5.3 Label in Name still holds: the visible label is "2" and the accessible name
 * "Page 2" contains it, so voice control by reading what is on screen continues to work.
 */
function PageNumber({ page }: { readonly page: number }) {
  return (
    <>
      <VisuallyHidden>{`Page ${String(page)}`}</VisuallyHidden>
      <span aria-hidden="true">{page}</span>
    </>
  );
}

function Step({
  direction,
  page,
  disabled,
  hrefForPage,
  linkAs: Link,
}: {
  readonly direction: 'previous' | 'next';
  readonly page: number;
  readonly disabled: boolean;
  readonly hrefForPage: (page: number) => string;
  readonly linkAs: ElementType;
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  const label = direction === 'previous' ? 'Previous page' : 'Next page';

  if (disabled) {
    /**
     * A `<span>` at the boundary, rather than a link with `aria-disabled`.
     *
     * `aria-disabled` on an anchor tells assistive technology the control is unavailable while
     * leaving it fully clickable, so a mouse user follows it anyway. Removing the anchor removes
     * the ambiguity. The arrow stays in place so the row does not reflow between pages.
     */
    return (
      <span aria-hidden="true" className={cn(CELL, 'text-neutral-300')}>
        <Icon className="size-5" />
      </span>
    );
  }

  return (
    <Link href={hrefForPage(page)} className={cn(CELL, 'text-copy hover:bg-primary-50')}>
      <Icon className="size-5" aria-hidden="true" />
      <VisuallyHidden>{label}</VisuallyHidden>
    </Link>
  );
}
