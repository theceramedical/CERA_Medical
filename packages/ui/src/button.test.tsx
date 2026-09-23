import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button, ButtonLink } from './button.tsx';

import type { ReactNode } from 'react';

/**
 * The assertions that matter here are the loading and disabled behaviours.
 *
 * Variant classes are close to tautological - they assert the component applies the string it was
 * written to apply - so they are covered once, broadly. The behavioural contract from
 * design-language.md section 5.1 is where the real risk is, because it is invisible on screen: a
 * loading button that still submits, or whose accessible name changes mid-interaction, looks
 * perfectly fine in a screenshot.
 */

describe('Button', () => {
  it('defaults to type="button" rather than submit', async () => {
    /**
     * HTML defaults a button to `submit`, so any button inside a form submits it. A "Clear
     * filters" control that reloads the page is a genuinely confusing bug, and this is the
     * cheapest possible place to prevent it.
     */
    const onSubmit = vi.fn((event: React.FormEvent) => {
      event.preventDefault();
    });

    render(
      <form onSubmit={onSubmit}>
        <Button>Clear filters</Button>
      </form>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when explicitly asked to', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => {
      event.preventDefault();
    });

    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Send enquiry</Button>
      </form>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe('loading', () => {
    it('keeps the accessible name unchanged', () => {
      // The label must not become "Loading…". Changing it mid-interaction is reported by a screen
      // reader as a different control appearing, and it also changes the button's width - so the
      // layout jumps and a second click lands on whatever moved into place.
      const { rerender } = render(<Button>Send enquiry</Button>);

      expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeInTheDocument();

      rerender(<Button loading>Send enquiry</Button>);

      expect(screen.getByRole('button', { name: 'Send enquiry' })).toBeInTheDocument();
    });

    it('marks itself busy so the state change is announced in place', () => {
      render(<Button loading>Send enquiry</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('cannot be activated, so a second click cannot double-submit', async () => {
      const onClick = vi.fn();

      render(
        <Button loading onClick={onClick}>
          Send enquiry
        </Button>,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is not busy when idle', () => {
      render(<Button>Send enquiry</Button>);

      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });

    it('does not announce twice from the nested spinner', () => {
      /**
       * The button already announces through `aria-busy`. A `role="status"` inside it would make
       * the screen reader say the same thing again, which is why `Spinner` takes `announce`.
       */
      render(<Button loading>Send enquiry</Button>);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('disabled', () => {
    it('blocks activation', async () => {
      const onClick = vi.fn();

      render(
        <Button disabled onClick={onClick}>
          Unavailable
        </Button>,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('uses a real disabled attribute rather than aria-disabled alone', () => {
      // `aria-disabled` announces the state but leaves the control clickable, so the handler still
      // fires. For a control that genuinely must not run, that is a bug wearing a label.
      render(<Button disabled>Unavailable</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('icons', () => {
    it('hides a decorative icon from assistive technology', () => {
      render(<Button iconEnd={<svg data-testid="arrow" />}>Explore Services</Button>);

      // The wrapper carries aria-hidden, so the guarantee does not depend on what was passed.
      expect(screen.getByTestId('arrow').parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('leaves the accessible name as the label alone', () => {
      render(<Button iconStart={<svg aria-label="ignored" />}>Read More</Button>);

      expect(screen.getByRole('button', { name: 'Read More' })).toBeInTheDocument();
    });

    it('renders nothing for an absent icon', () => {
      const { container } = render(<Button>No icon</Button>);

      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
    });
  });

  describe('sizes', () => {
    it.each([
      ['sm', 'h-9'],
      ['md', 'h-11'],
      ['lg', 'h-12'],
    ] as const)('renders %s at the height from the reference', (size, expected) => {
      render(<Button size={size}>Label</Button>);

      expect(screen.getByRole('button')).toHaveClass(expected);
    });

    it('expands the small size to a 44px pointer target', () => {
      /**
       * 36px meets neither SC 2.5.8 (24px, AA) comfortably nor the 44px the design contract
       * commits to. The overlay grows the target vertically without changing how the button
       * looks - and only vertically, because horizontal growth would overlap the neighbour in a
       * button row, turning a slightly-small target into a mis-tap on the wrong action.
       */
      render(<Button size="sm">Small</Button>);

      expect(screen.getByRole('button')).toHaveClass('after:h-11');
    });

    it('does not expand sizes that are already large enough', () => {
      render(<Button size="md">Medium</Button>);

      expect(screen.getByRole('button')).not.toHaveClass('after:h-11');
    });
  });

  describe('variants', () => {
    it.each([
      ['primary', 'bg-primary'],
      ['accent', 'bg-accent-fill'],
      ['outline', 'border-border-control'],
      ['ghost', 'text-primary'],
      ['on-dark', 'bg-neutral-0'],
    ] as const)('applies the %s variant', (variant, expected) => {
      render(<Button variant={variant}>Label</Button>);

      expect(screen.getByRole('button')).toHaveClass(expected);
    });

    it('fills the accent variant with teal-700, not the sampled teal-600', () => {
      // White on teal-600 measures 3.42:1 and fails AA for a 15px label. Asserted here as well as
      // in the contrast suite, because this is the call site that would regress.
      render(<Button variant="accent">Make an Enquiry</Button>);

      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-accent-fill');
      expect(button).not.toHaveClass('bg-accent');
    });

    it('borders the outline variant with the control token, not the decorative hairline', () => {
      render(<Button variant="outline">Make an Enquiry</Button>);

      const button = screen.getByRole('button');

      expect(button).toHaveClass('border-border-control');
      expect(button).not.toHaveClass('border-border');
    });
  });

  it('forwards arbitrary props, so aria-describedby and data attributes survive', () => {
    render(
      <Button aria-describedby="hint" data-analytics="hero-cta">
        Explore Services
      </Button>,
    );

    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('aria-describedby', 'hint');
    expect(button).toHaveAttribute('data-analytics', 'hero-cta');
  });

  it('lets a caller override a conflicting class instead of emitting both', () => {
    render(<Button className="h-12">Tall</Button>);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('h-12');
    expect(button).not.toHaveClass('h-11');
  });

  it('is reachable and operable by keyboard', async () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Explore Services</Button>);

    await userEvent.tab();

    expect(screen.getByRole('button')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    // A native <button> handles both keys. This asserts nothing has replaced it with a div.
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

describe('ButtonLink', () => {
  it('renders an anchor, so navigation behaves like navigation', () => {
    /**
     * A button used for navigation has no href, so middle-click, ctrl-click, "copy link address",
     * and the browser's status bar preview all stop working - none of which is visible in a
     * screenshot, and all of which users notice.
     */
    render(<ButtonLink href="/services">Explore services</ButtonLink>);

    const link = screen.getByRole('link', { name: 'Explore services' });

    expect(link).toHaveAttribute('href', '/services');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('carries no type attribute', () => {
    // `type` on an anchor means the MIME type of the destination, not a button behaviour.
    render(<ButtonLink href="/services">Explore services</ButtonLink>);

    expect(screen.getByRole('link')).not.toHaveAttribute('type');
  });

  it('looks identical to the equivalent Button', () => {
    // The two share `buttonVariants`, which is the point of keeping the recipe separate from the
    // element: a visual difference between a link-button and a button is a design bug that a
    // screenshot review would have to catch.
    const { container: buttonContainer } = render(<Button variant="accent">Enquire</Button>);
    const { container: linkContainer } = render(
      <ButtonLink href="/enquire" variant="accent">
        Enquire
      </ButtonLink>,
    );

    const buttonClasses = new Set(buttonContainer.firstElementChild?.className.split(' '));

    for (const className of linkContainer.firstElementChild?.className.split(' ') ?? []) {
      // `no-underline` is the one addition, because an anchor inherits `text-decoration` where a
      // button does not.
      if (className === 'no-underline') continue;

      expect(buttonClasses).toContain(className);
    }
  });

  it('renders through a supplied link component', () => {
    // `apps/web` passes `next/link`. Without this the design system would have to import it, which
    // would make the package Next-only.
    function FakeLink({ href, children, ...rest }: { href: string; children: ReactNode }) {
      return (
        <a href={href} data-routed="true" {...rest}>
          {children}
        </a>
      );
    }

    render(
      <ButtonLink as={FakeLink} href="/services">
        Explore services
      </ButtonLink>,
    );

    expect(screen.getByRole('link')).toHaveAttribute('data-routed', 'true');
  });

  it('hides a decorative icon', () => {
    const { container } = render(
      <ButtonLink href="/services" iconEnd={<svg data-testid="arrow" />}>
        Explore services
      </ButtonLink>,
    );

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
