import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert } from './alert.tsx';
import { Badge, Pill } from './badge.tsx';
import { Card, CardSpacer } from './card.tsx';
import { Divider, SectionRule } from './divider.tsx';
import { EmptyState } from './empty-state.tsx';
import { IconDisc } from './icon-disc.tsx';
import { Skeleton, SkeletonRegion } from './skeleton.tsx';

/**
 * Surfaces and states.
 *
 * The recurring theme is what is hidden and what is not. Every decorative element here has to be
 * absent from the accessibility tree and every meaningful one has to be present, and getting it
 * backwards is invisible on screen either way - a decorative disc that is announced just adds a
 * word, and a status whose only content is a colour reads as nothing at all.
 */

describe('Card', () => {
  it('is not itself a link', () => {
    /**
     * The whole-card anchor is the shortcut this component exists to prevent: it produces one link
     * whose accessible name is every word in the card, and it makes the title link inside it
     * invalid markup.
     */
    render(
      <Card>
        <a href="/services/cardiology">Cardiology</a>
      </Card>,
    );

    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Cardiology');
  });

  it('renders as a list item when asked, so a row of cards is a list', () => {
    render(
      <ul>
        <Card as="li">Service</Card>
      </ul>,
    );

    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('mirrors its hover treatment on focus-within', () => {
    // Hover is unavailable to keyboard and touch users, so any state change that communicates
    // "this is the active card" has to have a focus equivalent.
    const { container } = render(<Card interactive>Service</Card>);
    const card = container.firstElementChild;

    expect(card).toHaveClass('hover:shadow-card-hover');
    expect(card).toHaveClass('focus-within:shadow-card-hover');
  });

  it('keeps its spacer out of the accessibility tree', () => {
    const { container } = render(<CardSpacer />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Badge', () => {
  it('always carries a text label, not colour alone', () => {
    // WCAG 2.2 SC 1.4.1. A tinted chip with no word is invisible to a screen reader and meaningless
    // in forced-colours mode, where the tint is discarded.
    render(<Badge tone="warning">Under review</Badge>);

    expect(screen.getByText('Under review')).toBeInTheDocument();
  });

  it('names what the status describes', () => {
    render(
      <Badge tone="info" srPrefix="Enquiry status">
        Under review
      </Badge>,
    );

    // "Under review" alone does not say what is under review or that it is a status at all.
    expect(screen.getByText(/enquiry status/i)).toBeInTheDocument();
  });

  it.each(['neutral', 'info', 'success', 'warning', 'danger'] as const)(
    'renders the %s tone with a border as well as a fill',
    (tone) => {
      // The border is what keeps the badge a distinguishable shape once the fill is replaced by the
      // system palette in forced-colours mode.
      const { container } = render(<Badge tone={tone}>Label</Badge>);

      expect(container.firstElementChild?.className).toMatch(/\bborder-/);
    },
  );
});

describe('Pill', () => {
  it('prefixes the category for assistive technology', () => {
    /**
     * Without it the announcement is a bare word dropped between the cover image and the title,
     * with nothing saying what it refers to.
     */
    render(<Pill>Wellness</Pill>);

    expect(screen.getByText(/category/i)).toBeInTheDocument();
  });

  it('is not a link', () => {
    render(<Pill>Wellness</Pill>);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('IconDisc', () => {
  it('is always hidden from assistive technology', () => {
    // Every disc in this design sits beside a real label, so an accessible name here could only
    // duplicate the words underneath it.
    const { container } = render(
      <IconDisc>
        <svg />
      </IconDisc>,
    );

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Divider and SectionRule', () => {
  it('Divider is a real separator', () => {
    // An `hr` carries `role="separator"` for free, which is what makes the break audible rather
    // than two sections being read as continuous prose.
    render(<Divider />);

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('Divider can opt out when the markup already conveys the boundary', () => {
    const { container } = render(<Divider decorative />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('SectionRule is never a separator', () => {
    /**
     * It is ornament above a heading. Announcing a separator before every section heading is noise,
     * and the heading already says a new section is starting.
     */
    const { container } = render(<SectionRule />);

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Alert', () => {
  it('interrupts for an error and waits for anything else', () => {
    /**
     * `role="alert"` is an assertive live region: it cuts off whatever the screen reader was
     * mid-sentence on. Right for "we could not submit your enquiry", wrong for a confirmation.
     */
    const { rerender } = render(<Alert tone="danger" title="We could not submit your enquiry" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<Alert tone="success" title="Enquiry received" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('pairs the tone with an icon as well as a tint', () => {
    // SC 1.4.1: the tint cannot be the only thing separating a warning from a confirmation.
    const { container } = render(<Alert tone="warning" title="Check your details" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Skeleton', () => {
  it('is hidden, because the shape means nothing', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('drops the animation under prefers-reduced-motion rather than only shortening it', () => {
    /**
     * The global rule in theme.css sets the duration to 0.01ms, which stops the movement but
     * leaves the element wherever the animation's first frame puts it - potentially mid-fade.
     * Removing the animation is the only way to guarantee it settles at full opacity.
     */
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).toHaveClass('motion-reduce:animate-none');
  });

  it('announces the wait once, in words', () => {
    // Without this a screen reader user gets a page that reports itself complete and empty, with no
    // reason to wait.
    render(
      <SkeletonRegion label="Loading services" loading>
        <Skeleton />
      </SkeletonRegion>,
    );

    expect(screen.getByText('Loading services')).toBeInTheDocument();
  });

  it('removes the announcement once loading finishes', () => {
    render(
      <SkeletonRegion label="Loading services" loading={false}>
        <p>Cardiology</p>
      </SkeletonRegion>,
    );

    expect(screen.queryByText('Loading services')).not.toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('gives the heading and the explanation, not just one', () => {
    /**
     * The two failure modes are opposite: "No results" alone says nothing about what to do next,
     * and a paragraph with no heading is missed entirely by someone scanning by heading.
     */
    render(
      <EmptyState
        heading="No services match your filters"
        description="Try removing a filter or searching for a different term."
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'No services match your filters' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/try removing a filter/i)).toBeInTheDocument();
  });

  it('takes its heading level from the caller', () => {
    // A hardcoded level produces a skipped heading wherever the surrounding section differs, and
    // heading order is one of the things the axe baseline checks.
    render(<EmptyState heading="Nothing yet" description="Check back soon." headingLevel={2} />);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
