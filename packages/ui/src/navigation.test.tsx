import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Breadcrumbs } from './breadcrumbs.tsx';
import { FocusTrap } from './focus-trap.tsx';
import { Pagination, pageList } from './pagination.tsx';
import { MainContent, SkipLink } from './skip-link.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from './table.tsx';

describe('Breadcrumbs', () => {
  const ITEMS = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Cardiology' },
  ];

  it('names its landmark', () => {
    // A page with several navs otherwise gives a screen reader user a landmark list reading
    // "navigation, navigation, navigation".
    render(<Breadcrumbs items={ITEMS} />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('is an ordered list, because the order is the meaning', () => {
    const { container } = render(<Breadcrumbs items={ITEMS} />);

    expect(container.querySelector('ol')).toBeInTheDocument();
  });

  it('marks the current page and does not link to it', () => {
    // A link to the page you are already on is a control that does nothing.
    render(<Breadcrumbs items={ITEMS} />);

    const current = screen.getByText('Cardiology');

    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('hides the separators', () => {
    // Otherwise every level is read as "Services greater than Cardiology".
    const { container } = render(<Breadcrumbs items={ITEMS} />);

    for (const svg of container.querySelectorAll('svg')) {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('underlines the links rather than relying on colour', () => {
    render(<Breadcrumbs items={ITEMS} />);

    expect(screen.getByRole('link', { name: 'Services' })).toHaveClass('underline');
  });
});

describe('Pagination', () => {
  const hrefForPage = (page: number) => `/articles?page=${String(page)}`;

  it('renders nothing when there is only one page', () => {
    // An empty labelled landmark is a dead end in a landmark list.
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} hrefForPage={hrefForPage} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('names its landmark', () => {
    render(<Pagination currentPage={2} totalPages={5} hrefForPage={hrefForPage} />);

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('marks the current page and renders it as text', () => {
    /**
     * `aria-current` is the text equivalent of the filled square. Without it a screen reader reads
     * "1 2 3 4 5" as five links with no indication of which page is showing - the colour-only
     * signal SC 1.4.1 rules out.
     */
    render(<Pagination currentPage={3} totalPages={5} hrefForPage={hrefForPage} />);

    // `closest`, because the announced text and the painted digit are deliberately different nodes -
    // see `PageNumber`.
    expect(screen.getByText('Page 3').closest('[aria-current="page"]')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Page 3' })).not.toBeInTheDocument();
  });

  it('gives each number a full accessible name', () => {
    // A link list built from this component would otherwise be a column of bare digits.
    render(<Pagination currentPage={1} totalPages={5} hrefForPage={hrefForPage} />);

    expect(screen.getByRole('link', { name: 'Page 2' })).toBeInTheDocument();
  });

  it('puts a space between the word and the digit', () => {
    /**
     * The regression guard for a real defect. A visually hidden "Page " followed by the number
     * computes to the name "Page2": accessible-name computation concatenates child text and trims,
     * and with no whitespace text node between the two the trailing space is discarded. It reads
     * correctly on screen and is announced wrong, which is why only a name assertion catches it.
     */
    render(<Pagination currentPage={1} totalPages={5} hrefForPage={hrefForPage} />);

    expect(screen.getByRole('link', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Page2' })).not.toBeInTheDocument();
  });

  it('names the step controls', () => {
    render(<Pagination currentPage={3} totalPages={5} hrefForPage={hrefForPage} />);

    expect(screen.getByRole('link', { name: 'Previous page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next page' })).toBeInTheDocument();
  });

  it('removes a step control at the boundary instead of disabling a link', () => {
    /**
     * `aria-disabled` on an anchor tells assistive technology the control is unavailable while
     * leaving it fully clickable, so a mouse user follows it anyway.
     */
    render(<Pagination currentPage={1} totalPages={5} hrefForPage={hrefForPage} />);

    expect(screen.queryByRole('link', { name: 'Previous page' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next page' })).toBeInTheDocument();
  });

  it('uses 44px cells', () => {
    render(<Pagination currentPage={1} totalPages={5} hrefForPage={hrefForPage} />);

    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveClass('size-11');
  });

  describe('pageList', () => {
    it('keeps both ends reachable in one click', () => {
      expect(pageList(10, 20)).toStrictEqual([1, null, 9, 10, 11, null, 20]);
    });

    it('lists every page when they all fit', () => {
      expect(pageList(2, 4)).toStrictEqual([1, 2, 3, 4]);
    });

    it('fills a gap of exactly one rather than collapsing it', () => {
      // "1 … 3" is the same width as "1 2 3" and hides a page for no benefit.
      expect(pageList(4, 5)).toStrictEqual([1, 2, 3, 4, 5]);
    });

    it('never emits a page outside the range', () => {
      for (const page of pageList(1, 3)) {
        if (page !== null) expect(page).toBeGreaterThanOrEqual(1);
        if (page !== null) expect(page).toBeLessThanOrEqual(3);
      }
    });
  });
});

describe('SkipLink', () => {
  it('points at the main landmark', () => {
    render(
      <>
        <SkipLink />
        <MainContent>
          <h1>Services</h1>
        </MainContent>
      </>,
    );

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('becomes visible when focused', () => {
    /**
     * `VisuallyHidden` alone would leave a keyboard user tabbing to something they cannot see,
     * which reads as focus disappearing.
     */
    render(<SkipLink />);

    const link = screen.getByRole('link');

    expect(link.className).toContain('focus-visible:fixed');
    expect(link.className).toContain('focus-visible:[clip-path:none]');
  });

  it('makes its target programmatically focusable', () => {
    // Without `tabindex="-1"` the link scrolls the page but leaves focus on itself, so the next Tab
    // continues through the header anyway.
    render(
      <MainContent>
        <h1>Services</h1>
      </MainContent>,
    );

    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });
});

describe('Table', () => {
  function Queue() {
    return (
      <Table caption="Open enquiries">
        <TableHead>
          <TableRow>
            <TableHeaderCell scope="col">Reference</TableHeaderCell>
            <TableHeaderCell scope="col">Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableHeaderCell scope="row">CERA-2026-0001</TableHeaderCell>
            <TableCell>Under review</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  it('takes its accessible name from the caption', () => {
    // A heading above the table does not serve: nothing associates the two.
    render(<Queue />);

    expect(screen.getByRole('table', { name: 'Open enquiries' })).toBeInTheDocument();
  });

  it('keeps the caption in the accessibility tree when it is hidden visually', () => {
    render(
      <Table caption="Open enquiries" captionHidden>
        <TableBody>
          <TableRow>
            <TableCell>Row</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('table', { name: 'Open enquiries' })).toBeInTheDocument();
  });

  it('scopes column and row headers', () => {
    /**
     * This is what lets a screen reader say "Status, Under review" rather than reading a bare
     * status with no reference number attached.
     */
    render(<Queue />);

    expect(screen.getByRole('columnheader', { name: 'Status' })).toHaveAttribute('scope', 'col');
    expect(screen.getByRole('rowheader', { name: 'CERA-2026-0001' })).toHaveAttribute(
      'scope',
      'row',
    );
  });

  it('makes the scroll container a named, focusable region', () => {
    /**
     * A `div` with `overflow-x: auto` scrolls by mouse and touch but not by keyboard, because it is
     * not focusable - WCAG 2.1.1. The name is what stops the resulting tab stop being silent.
     */
    render(<Queue />);

    const region = screen.getByRole('region', { name: /open enquiries, scrollable/i });

    expect(region).toHaveAttribute('tabindex', '0');
  });
});

describe('FocusTrap', () => {
  function Disclosure() {
    const [open, setOpen] = useState(false);

    return (
      <>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
        >
          Open menu
        </button>
        <button type="button">Outside</button>
        {open ? (
          <FocusTrap
            active
            onClose={() => {
              setOpen(false);
            }}
          >
            <a href="/services">Services</a>
            <a href="/about">About</a>
          </FocusTrap>
        ) : null}
      </>
    );
  }

  it('moves focus into the panel when it opens', async () => {
    // Without this the trap is armed but focus is still outside it, so the first Tab escapes before
    // the key handler ever sees a press.
    render(<Disclosure />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('link', { name: 'Services' })).toHaveFocus();
  });

  it('cycles focus rather than letting Tab leave the panel', async () => {
    /**
     * Tab out of an open overlay lands on the page behind it - still on screen but covered - so the
     * focus ring vanishes and the user operates controls they cannot see.
     */
    render(<Disclosure />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.tab();

    expect(screen.getByRole('link', { name: 'About' })).toHaveFocus();

    await userEvent.tab();

    expect(screen.getByRole('link', { name: 'Services' })).toHaveFocus();
  });

  it('wraps backwards from the first element to the last', async () => {
    render(<Disclosure />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.tab({ shift: true });

    expect(screen.getByRole('link', { name: 'About' })).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    /**
     * A trap with no escape is a keyboard user stuck in a panel with no way out short of reloading,
     * which is strictly worse than no trap. Returning focus is what stops them being dumped at the
     * top of the document.
     */
    render(<Disclosure />);

    const trigger = screen.getByRole('button', { name: 'Open menu' });

    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('link', { name: 'Services' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on a click outside', async () => {
    render(<Disclosure />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('link', { name: 'Services' })).not.toBeInTheDocument();
  });

  it('keeps focus inside a panel with nothing focusable in it', async () => {
    const onClose = vi.fn();

    render(
      <>
        <button type="button">Outside</button>
        <FocusTrap active onClose={onClose}>
          <p>Nothing to focus here</p>
        </FocusTrap>
      </>,
    );

    await userEvent.tab();

    // The empty panel must not hand focus to the page behind it.
    expect(screen.getByRole('button', { name: 'Outside' })).not.toHaveFocus();
  });

  it('ignores controls inside a collapsed sub-panel', async () => {
    /**
     * A selector match is not enough. A hidden sub-panel inside the trap still contains focusable
     * elements, and cycling into one sends focus somewhere invisible - which the user experiences
     * as the focus ring disappearing for a turn.
     */
    render(
      <FocusTrap active onClose={vi.fn()}>
        <button type="button">First</button>
        <div style={{ display: 'none' }}>
          <button type="button">Collapsed</button>
        </div>
        <button type="button">Last</button>
      </FocusTrap>,
    );

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  it('ignores disabled controls when cycling', async () => {
    /**
     * A disabled control is skipped by the browser, so treating it as the trap's last element would
     * make focus land on `<body>` - outside the trap, which is the exact failure this prevents.
     */
    render(
      <FocusTrap active onClose={vi.fn()}>
        <button type="button">First</button>
        <button type="button" disabled>
          Disabled
        </button>
        <button type="button">Last</button>
      </FocusTrap>,
    );

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });
});

describe('table markup composes into a real grid', () => {
  it('reports the right number of rows including the header row', () => {
    render(
      <Table caption="Statuses" captionHidden>
        <TableHead>
          <TableRow>
            <TableHeaderCell scope="col">Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>New</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Under review</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByRole('table');

    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });
});
