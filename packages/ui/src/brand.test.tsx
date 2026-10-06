import { render, screen } from '@testing-library/react';
import { ChevronRight, Search } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { ICON_SIZE_CLASS, Icon } from './icon.tsx';
import { CtaScript, HeroScript } from './script-art.tsx';
import { PLATFORM_NAME, SocialLink, SocialMark, type SocialPlatform } from './social.tsx';
import { CrossAndLeaf, Wordmark } from './wordmark.tsx';

const PLATFORMS: readonly SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'youtube'];

/**
 * Icons and brand artwork.
 *
 * All of it is decoration, and the assertions are correspondingly about what is *absent* from the
 * accessibility tree. That is the harder direction to verify by eye: an icon that is wrongly
 * announced looks perfect, and the defect is a screen reader saying "arrow right, Explore services"
 * or reading a handwritten flourish aloud in the middle of the hero.
 */

describe('Icon', () => {
  it('is hidden by default', () => {
    /**
     * The default is the safe one, and naming an icon is the thing you ask for rather than the thing
     * you remember. An icon beside a text label adds no information.
     */
    const { container } = render(<Icon icon={ChevronRight} />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('takes a name when it is a control\u2019s only content', () => {
    // The header's search button is the case: an icon-only control with no name is announced as
    // "button".
    render(
      <button type="button">
        <Icon icon={Search} label="Search the site" />
      </button>,
    );

    expect(screen.getByRole('button', { name: 'Search the site' })).toBeInTheDocument();
  });

  it('renders the name as hidden text rather than aria-label on the svg', () => {
    /**
     * `aria-label` on an `<svg>` is honoured inconsistently - some engines ignore it unless the
     * element also carries `role="img"` - and hidden text is announced by everything.
     */
    const { container } = render(<Icon icon={Search} label="Search the site" />);
    const svg = container.querySelector('svg');

    expect(svg).not.toHaveAttribute('aria-label');
    expect(screen.getByText('Search the site')).toBeInTheDocument();
  });

  it.each(['sm', 'md', 'lg', 'xl'] as const)('sizes %s on the 4px scale', (size) => {
    const { container } = render(<Icon icon={ChevronRight} size={size} />);

    expect(container.querySelector('svg')).toHaveClass(ICON_SIZE_CLASS[size]);
  });

  it('uses complete class strings for its sizes', () => {
    /**
     * A computed `size-${n}` would compile and generate nothing, because Tailwind scans source for
     * whole class names - leaving every icon at its intrinsic 24px with no error anywhere.
     */
    for (const className of Object.values(ICON_SIZE_CLASS)) {
      expect(className).toMatch(/^size-\d+$/);
    }
  });

  it('does not shrink inside a flex row', () => {
    // Without `shrink-0`, flex compresses the icon rather than wrapping the label, so a 20px glyph
    // becomes a smear at narrow widths.
    const { container } = render(<Icon icon={ChevronRight} />);

    expect(container.querySelector('svg')).toHaveClass('shrink-0');
  });

  it('leaves the stroke as currentColor', () => {
    // An icon with its own colour would need its own contrast pairing, and would be invisible in
    // forced-colours mode, where only `currentColor` follows the system palette.
    const { container } = render(<Icon icon={ChevronRight} />);

    expect(container.querySelector('svg')).toHaveAttribute('stroke', 'currentColor');
  });
});

describe('Wordmark', () => {
  it('exposes the lock-up with an accessible name', () => {
    render(<Wordmark />);

    expect(screen.getByRole('img', { name: 'CERA Medical' })).toBeInTheDocument();
  });

  it('is not a heading', () => {
    render(<Wordmark />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders as a supplied element so the header can wrap it in a link', () => {
    render(<Wordmark as="span" />);

    expect(screen.getByRole('img', { name: 'CERA Medical' }).closest('span')).not.toBeNull();
  });

  it('inverts for a dark background', () => {
    render(<Wordmark onDark />);

    expect(screen.getByRole('img', { name: 'CERA Medical' })).toHaveClass('invert');
  });

  it('draws the mark from currentColor', () => {
    const { container } = render(<CrossAndLeaf />);

    for (const path of container.querySelectorAll('path')) {
      expect(path).toHaveAttribute('fill', 'currentColor');
    }
  });

  it('is not focusable', () => {
    // Edge in IE mode still honours the legacy behaviour that makes an SVG a tab stop, and a silent
    // tab stop is the symptom.
    const { container } = render(<CrossAndLeaf />);

    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });
});

describe('social marks', () => {
  it.each(PLATFORMS)('%s is drawn rather than taken from the icon set', (platform) => {
    /**
     * `lucide-react` 1.x removed every brand icon - `Linkedin`, `Facebook`, `Instagram`, and
     * `Youtube` all existed in 0.x and are gone, on the reasonable grounds that trademarks have
     * their own usage rules. This asserts the replacement exists, since the alternative discovered
     * at build time is four blank squares in the footer.
     */
    const { container } = render(<SocialMark platform={platform} />);

    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it.each(PLATFORMS)('%s fills from currentColor', (platform) => {
    // One set works on the light footer and on a dark band, and forced-colours mode substitutes a
    // system colour rather than leaving four invisible squares.
    const { container } = render(<SocialMark platform={platform} />);

    expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
  });

  it.each(PLATFORMS)('%s is hidden, because the link carries the name', (platform) => {
    const { container } = render(<SocialMark platform={platform} />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(PLATFORMS)('%s link is named as a destination', (platform) => {
    /**
     * "LinkedIn" alone gives a link list four brand names with no indication of what following one
     * does.
     *
     * The new-tab phrase is part of the name rather than left off for brevity, because `Link` with
     * `external` announces it too. A package where one external link says so and another does not is
     * a package where someone eventually "fixes" the wrong one.
     */
    render(<SocialLink platform={platform} href="https://example.org" />);

    expect(
      screen.getByRole('link', {
        name: `CERA Medical on ${PLATFORM_NAME[platform]} (opens in a new tab)`,
      }),
    ).toBeInTheDocument();
  });

  it('opens off-site links safely', () => {
    // `noopener` stops the opened page reaching back through `window.opener`. Set unconditionally,
    // because there is no version of a social link that wants it off.
    render(<SocialLink platform="linkedin" href="https://example.org" />);

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('gives the 32px mark a 44px target', () => {
    // The visible circle stays 32px because larger looks wrong in a footer column; the padding takes
    // the pointer target to 44px.
    render(<SocialLink platform="facebook" href="https://example.org" />);

    expect(screen.getByRole('link')).toHaveClass('size-11');
  });
});

describe('script artwork', () => {
  it.each([
    ['HeroScript', HeroScript],
    ['CtaScript', CtaScript],
  ])('%s is hidden, has no title, and is not an image', (_name, Component) => {
    /**
     * design-language.md section 2 rules both phrases decorative artwork rather than text. A
     * `<title>` or `role="img"` would put them back in the accessibility tree, where
     * "Care Support Wellness For a Brighter Tomorrow" is an interruption made of marketing copy -
     * and unreadable as speech in the order the strokes are drawn.
     */
    const { container } = render(<Component />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(svg?.querySelector('title')).toBeNull();
  });

  it.each([
    ['HeroScript', HeroScript],
    ['CtaScript', CtaScript],
  ])('%s loads no font', (_name, Component) => {
    /**
     * The point of drawing these rather than setting them: a script family used on two elements is a
     * font file, a render-blocking fetch, and a layout shift, all for ornament. No `<text>` element
     * means nothing to resolve a family for.
     */
    const { container } = render(<Component />);

    expect(container.querySelectorAll('text')).toHaveLength(0);
    expect(container.querySelector('svg')?.getAttribute('font-family')).toBeNull();
  });

  it.each([
    ['HeroScript', HeroScript],
    ['CtaScript', CtaScript],
  ])('%s strokes in currentColor so it follows the surrounding ink', (_name, Component) => {
    const { container } = render(<Component />);

    expect(container.querySelector('svg')).toHaveAttribute('stroke', 'currentColor');
  });

  it.each([
    ['HeroScript', HeroScript],
    ['CtaScript', CtaScript],
  ])('%s scales with its container rather than a fixed size', (_name, Component) => {
    // A fixed width would overflow at 320px and clip at 400% reflow, both of which WP-03.8 checks.
    const { container } = render(<Component />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('viewBox');
    expect(svg).not.toHaveAttribute('width');
    expect(svg).toHaveClass('w-full');
  });
});
