import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Heading, scaleClasses, Text, type TypeScale } from './typography.tsx';

/**
 * The property under test is that heading *level* and heading *size* stay independent.
 *
 * Every other assertion here is bookkeeping. This one is the reason the component exists: a
 * component that picks `<h4>` because it wants 16px text breaks document structure for screen
 * reader users, and nothing on screen shows it.
 */

const ALL_SCALES: TypeScale[] = [
  'display-1',
  'h1',
  'h2',
  'h3',
  'h4',
  'body-lg',
  'body',
  'body-sm',
  'caption',
  'eyebrow',
  'pill',
  'button',
];

describe('Heading', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('renders level %i as the matching element', (level) => {
    render(<Heading level={level}>Section</Heading>);

    expect(screen.getByRole('heading', { level })).toHaveTextContent('Section');
  });

  it('takes its size from its level by default', () => {
    render(<Heading level={2}>Our Medical Services</Heading>);

    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-h2');
  });

  it('renders a level 1 heading at display size without changing the level', () => {
    // The hero. Exactly one h1 on the page, rendered larger than a default h1.
    render(
      <Heading level={1} size="display-1">
        Trusted Medical Services,
      </Heading>,
    );

    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading.tagName).toBe('H1');
    expect(heading).toHaveClass('text-display-1');
    expect(heading).not.toHaveClass('text-h1');
  });

  it('renders a small size at a high level, which is the case the API exists for', () => {
    // A section heading that is visually small but still the section's h2. Writing this as an
    // <h4> to get the size is the mistake being prevented.
    render(
      <Heading level={2} size="h4">
        Quick Links
      </Heading>,
    );

    const heading = screen.getByRole('heading', { level: 2 });

    expect(heading.tagName).toBe('H2');
    expect(heading).toHaveClass('text-h4');
  });

  it('uses the heading ink tone by default', () => {
    render(<Heading level={3}>Explore</Heading>);

    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('text-foreground');
  });

  it('accepts a tone for the CTA band, where the heading sits on a dark gradient', () => {
    render(
      <Heading level={2} tone="on-dark">
        Need help finding the right service?
      </Heading>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-on-primary');
  });

  it('passes through an id so a section can be labelled by its heading', () => {
    // `aria-labelledby` on a <section> points at the heading's id. Dropping unknown props
    // would break that quietly.
    render(
      <Heading level={2} id="services-heading">
        Our Medical Services
      </Heading>,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'services-heading');
  });

  it('lets a caller override classes rather than duplicating them', () => {
    // twMerge resolves the conflict, so the caller's size wins instead of both being emitted
    // and the outcome depending on stylesheet order.
    render(
      <Heading level={2} className="text-h1">
        Overridden
      </Heading>,
    );

    const heading = screen.getByRole('heading', { level: 2 });

    expect(heading).toHaveClass('text-h1');
    expect(heading).not.toHaveClass('text-h2');
  });
});

describe('Text', () => {
  it('renders a paragraph by default', () => {
    render(<Text>Clear information. Simple enquiries.</Text>);

    expect(screen.getByText('Clear information. Simple enquiries.').tagName).toBe('P');
  });

  it.each(['span', 'div', 'dd', 'dt', 'li', 'figcaption', 'strong'] as const)(
    'renders as %s when asked',
    (as) => {
      render(<Text as={as}>Label</Text>);

      expect(screen.getByText('Label').tagName).toBe(as.toUpperCase());
    },
  );

  it('defaults to the body step and the copy tone', () => {
    render(<Text>Default</Text>);

    const text = screen.getByText('Default');

    expect(text).toHaveClass('text-body');
    expect(text).toHaveClass('text-copy');
  });

  it('caps the measure only when asked', () => {
    render(
      <>
        <Text measure>Capped</Text>
        <Text>Uncapped</Text>
      </>,
    );

    expect(screen.getByText('Capped')).toHaveClass('max-w-measure');
    expect(screen.getByText('Uncapped')).not.toHaveClass('max-w-measure');
  });
});

describe('scale classes', () => {
  it.each(ALL_SCALES)('maps %s to a complete utility name', (size) => {
    // The lookup exists because `text-${size}` would compile and then generate nothing:
    // Tailwind scans for whole class strings, so an interpolated name is invisible to it and
    // the rule never reaches the stylesheet.
    expect(scaleClasses(size)).toContain(`text-${size}`);
  });

  it('uppercases eyebrow and pill through CSS, not through the copy', () => {
    // Capitalised source text is spelled out letter by letter by some screen readers, and it
    // cannot be lowercased again for a context that needs sentence case.
    expect(scaleClasses('eyebrow')).toContain('uppercase');
    expect(scaleClasses('pill')).toContain('uppercase');
  });

  it('leaves every other step in its authored case', () => {
    for (const size of ALL_SCALES.filter((step) => step !== 'eyebrow' && step !== 'pill')) {
      expect(scaleClasses(size), `${size} should not force case`).not.toContain('uppercase');
    }
  });

  it('never emits a raw colour, only a token utility', () => {
    // The whole point of the tone indirection. A hex here would also fail `no-raw-color`, but
    // this catches an arbitrary value like `text-[--some-var]` that the lint rule allows.
    for (const size of ALL_SCALES) {
      expect(scaleClasses(size)).not.toMatch(/#|rgb\(|\[/);
    }
  });
});
