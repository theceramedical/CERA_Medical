import { ALL_CUSTOMER_STATUSES, customerStatusLabel } from '@cera/contracts/status';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArticleCard } from './article-card.tsx';
import { ProcessStep, ProcessSteps } from './process-step.tsx';
import { SectionHeader } from './section-header.tsx';
import { ServiceCard } from './service-card.tsx';
import { STATUS_TONE, StatusBadge } from './status-badge.tsx';
import { Timeline, TimelineItem } from './timeline.tsx';

/**
 * Composites.
 *
 * Almost every assertion here is about link and list semantics, because that is what a composite
 * gets wrong. The individual primitives are already tested; what is new at this level is how they
 * are wired together, and the two failure modes - a card that is one enormous link, and an ordered
 * sequence rendered as unordered divs - both look completely correct on screen.
 */

describe('ServiceCard', () => {
  function renderCard() {
    return render(
      <ul>
        <ServiceCard
          title="Cardiology"
          description="Assessment and ongoing care for heart conditions."
          href="/services/cardiology"
          icon={<svg />}
        />
      </ul>,
    );
  }

  it('makes the title the link, not the card', () => {
    /**
     * A card-wide anchor gives one link whose accessible name is every word in the card, announced
     * as a single run, with the nested "Learn More" link now invalid markup. In a screen reader's
     * link list that is six unusable entries instead of six service names.
     */
    renderCard();

    expect(screen.getByRole('link', { name: 'Cardiology' })).toBeInTheDocument();
  });

  it('gives the second link a distinct accessible name', () => {
    // Two links reading "Learn More" in a link list are indistinguishable.
    renderCard();

    expect(screen.getByRole('link', { name: 'Learn more about Cardiology' })).toBeInTheDocument();
  });

  it('points both links at the same target', () => {
    renderCard();

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('href', '/services/cardiology');
    }
  });

  it('has exactly two links', () => {
    // Guards against the whole-card anchor being added back alongside the title link.
    renderCard();

    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('is a list item, so a row of cards is a list', () => {
    renderCard();

    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('hides its icon', () => {
    const { container } = renderCard();
    const disc = container.querySelector('[aria-hidden="true"]');

    expect(disc).not.toBeNull();
  });

  it('takes its heading level from the caller', () => {
    // The same card sits under an `h2` on the homepage and an `h3` on a category page.
    render(
      <ul>
        <ServiceCard
          title="Cardiology"
          description="Care for heart conditions."
          href="/services/cardiology"
          headingLevel={2}
        />
      </ul>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Cardiology' })).toBeInTheDocument();
  });

  it('renders the action as a link, not a button', () => {
    /**
     * "Learn More" navigates, so it must be an anchor. A button used for navigation has no href, so
     * middle-click, ctrl-click, "copy link address", and the status bar preview all stop working -
     * none of which is visible in a screenshot.
     */
    renderCard();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ArticleCard', () => {
  function renderCard(cover?: React.ReactNode) {
    return render(
      <ul>
        <ArticleCard
          title="Understanding blood pressure"
          excerpt="What the two numbers mean and when to act on them."
          href="/articles/understanding-blood-pressure"
          category="Wellness"
          {...(cover === undefined ? {} : { cover })}
        />
      </ul>,
    );
  }

  it('makes the title the link', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'Understanding blood pressure' })).toBeInTheDocument();
  });

  it('gives "Read More" a distinct accessible name', () => {
    renderCard();

    expect(
      screen.getByRole('link', { name: 'Read more: Understanding blood pressure' }),
    ).toBeInTheDocument();
  });

  it('prefixes the category for assistive technology', () => {
    renderCard();

    expect(screen.getByText(/category/i)).toBeInTheDocument();
  });

  it('does not make the category a link', () => {
    // The pill reads as a filter control, but making it one puts a third link in a card whose title
    // is already the link, and the category is reachable from the article page.
    renderCard();

    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('keeps the full excerpt in the DOM while clamping it visually', () => {
    /**
     * `line-clamp-2` truncates in the layout and leaves the text intact, so a screen reader reads
     * the whole excerpt. A JavaScript truncation would remove the words entirely.
     */
    renderCard();

    const excerpt = screen.getByText('What the two numbers mean and when to act on them.');

    expect(excerpt).toHaveClass('line-clamp-2');
  });

  it('treats the cover as decorative', () => {
    // The title immediately below carries the same meaning, so a real `alt` makes the card announce
    // its subject twice.
    renderCard(<img src="/cover.jpg" alt="" />);

    // An `alt=""` image has no accessible role, so it cannot be found by role - which is the
    // assertion: it is absent from the accessibility tree.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders without a cover rather than reserving an empty box', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'Understanding blood pressure' })).toBeInTheDocument();
  });
});

describe('ProcessSteps', () => {
  function renderSteps() {
    return render(
      <ProcessSteps>
        <ProcessStep ordinal={1} title="Explore" description="Browse our services." hasNext />
        <ProcessStep ordinal={2} title="Enquire" description="Tell us what you need." hasNext />
        <ProcessStep ordinal={3} title="Connect" description="We reply within a day." />
      </ProcessSteps>,
    );
  }

  it('is an ordered list', () => {
    // The order is the content, and the list is what communicates "1 of 3".
    const { container } = renderSteps();

    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('hides the visible ordinal', () => {
    /**
     * The `<ol>` already conveys position, so exposing "01" makes a screen reader announce
     * "01 Explore, 1 of 3" - the number twice, in two notations.
     */
    renderSteps();

    const ordinal = screen.getByText('01');

    expect(ordinal).toHaveAttribute('aria-hidden', 'true');
  });

  it('pads the ordinal to two digits, per the reference', () => {
    renderSteps();

    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('hides the chevrons and omits the trailing one', () => {
    // A chevron after the final step points at nothing.
    const { container } = renderSteps();
    const items = container.querySelectorAll('li');
    const chevrons = container.querySelectorAll('li > svg');

    expect(items).toHaveLength(3);
    expect(chevrons).toHaveLength(2);

    for (const chevron of chevrons) {
      expect(chevron).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

describe('SectionHeader', () => {
  it('requires the level to be stated', () => {
    /**
     * No default, unlike every other composite here. A section header establishes the level for
     * everything beneath it, so a wrong default cascades rather than affecting one element.
     */
    render(<SectionHeader level={2} heading="Our services" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Our services' })).toBeInTheDocument();
  });

  it('caps the sub-heading measure', () => {
    // A centred line longer than about 65 characters is hard to track back from at the line end.
    render(
      <SectionHeader level={2} heading="Our services" subheading="Care built around your needs." />,
    );

    expect(screen.getByText('Care built around your needs.')).toHaveClass('max-w-measure');
  });

  it('hides the decorative rule', () => {
    const { container } = render(<SectionHeader level={2} heading="Our services" />);

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('renders the optional action', () => {
    render(
      <SectionHeader
        level={2}
        heading="Our services"
        action={<a href="/services">View all services</a>}
      />,
    );

    expect(screen.getByRole('link', { name: 'View all services' })).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it.each(ALL_CUSTOMER_STATUSES)('renders %s with its contract label', (status) => {
    /**
     * The label comes from `@cera/contracts`, not from a map in the UI package. A second copy of the
     * wording would let the badge say "Under review" while the confirmation email says "In review",
     * with nothing failing.
     */
    render(<StatusBadge status={status} />);

    expect(screen.getByText(customerStatusLabel(status))).toBeInTheDocument();
  });

  it('has a tone for every customer status', () => {
    // `satisfies Record<CustomerStatus, ...>` enforces this at compile time; asserted at runtime as
    // well so the guarantee survives the type being loosened.
    for (const status of ALL_CUSTOMER_STATUSES) {
      expect(STATUS_TONE[status]).toBeDefined();
    }
  });

  it('is the only status that stands out when the customer has to act', () => {
    expect(STATUS_TONE.action_needed).toBe('warning');
    expect(STATUS_TONE.in_review).toBe('info');
    expect(STATUS_TONE.in_progress).toBe('info');
  });

  it('renders a closed enquiry neutrally, not as an error', () => {
    /**
     * Red would read as a rejection, which for the withdrawn and no-response cases is actively
     * misleading - and a customer is never told which of the three internal closures applied.
     */
    expect(STATUS_TONE.closed).toBe('neutral');
  });

  it('names what the status describes', () => {
    render(<StatusBadge status="in_review" />);

    // A bare "Under review" beside a reference number says nothing about what is under review.
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  it('pairs the tone with words, never colour alone', () => {
    // WCAG 2.2 SC 1.4.1.
    render(<StatusBadge status="completed" />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});

describe('Timeline', () => {
  function renderTimeline() {
    return render(
      <Timeline>
        {/* The title describes the event and the badge reports the status. They are worded
            differently on purpose: repeating the status label as the title would have the row say
            the same thing twice. */}
        <TimelineItem
          dateTime="2026-09-21T09:15:00.000Z"
          dateLabel="21 September 2026"
          title="We received your enquiry"
        />
        <TimelineItem
          dateTime="2026-09-23T14:02:00.000Z"
          dateLabel="23 September 2026"
          title="Your enquiry is being reviewed"
          description="A member of our team is looking at your enquiry."
          marker={<StatusBadge status="in_review" />}
          isLast
        />
      </Timeline>,
    );
  }

  it('is an ordered list', () => {
    // A timeline of divs reads as a pile of unrelated sentences with no "2 of 2".
    const { container } = renderTimeline();

    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('carries a machine-readable timestamp alongside the readable one', () => {
    /**
     * Without `datetime`, "23 September 2026" is just a string and nothing can tell it is a date.
     * The visible text is formatted by the caller, because formatting needs a locale and a time
     * zone - and a component reaching for `toLocaleString()` with neither renders the server's zone
     * during SSR and the user's on hydration.
     */
    const { container } = renderTimeline();
    const times = container.querySelectorAll('time');

    expect(times).toHaveLength(2);
    expect(times[0]).toHaveAttribute('datetime', '2026-09-21T09:15:00.000Z');
  });

  it('announces the date as a phrase rather than a bare number', () => {
    /**
     * The regression guard for the `Page2` defect in a second place: a visually hidden "Updated "
     * followed by the visible date computes to "Updated23 September 2026", because accessible-name
     * computation trims each node's text before concatenating.
     */
    renderTimeline();

    expect(screen.getByText('Updated 23 September 2026')).toBeInTheDocument();
  });

  it('stops the connecting line at the last entry', () => {
    // A line continuing past the final entry implies history that is not there.
    const { container } = renderTimeline();
    const items = [...container.querySelectorAll('li')];
    const last = items.at(-1);

    expect(last?.querySelectorAll('span.grow')).toHaveLength(0);
    expect(items[0]?.querySelectorAll('span.grow')).toHaveLength(1);
  });

  it('keeps the rail out of the accessibility tree', () => {
    const { container } = renderTimeline();
    const firstItem = container.querySelector('li');

    expect(
      within(firstItem as HTMLElement).getByText('We received your enquiry'),
    ).toBeInTheDocument();
    expect(firstItem?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
