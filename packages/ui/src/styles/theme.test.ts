import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from 'tailwindcss';
import { beforeAll, describe, expect, it } from 'vitest';

import { COLOR_TOKENS, FONT_SIZE_TOKENS } from '../cn.ts';
import { readColorTokens, readRawTokens, readResolvedTokens } from '../tokens.ts';

/**
 * Compiles `theme.css` with the real Tailwind engine and asserts the utilities it produces.
 *
 * This exists because the `@theme` contract fails silently. A token named
 * `--text-body--lineheight` instead of `--text-body--line-height` is not a syntax error and
 * produces no warning; Tailwind simply does not emit a line-height, and the page renders at
 * the browser default. Nobody notices in review, and on the page it reads as "the spacing
 * looks slightly off" rather than as a broken token.
 *
 * So the assertion is not "the file parses" - it is "asking for `text-body` yields the size,
 * the line-height, and the weight this design system says it should".
 */

const THEME_DIR = dirname(fileURLToPath(import.meta.url));
const themeSource = readFileSync(join(THEME_DIR, 'theme.css'), 'utf8');

/** Utilities the design system relies on, named as a component would name them. */
const CANDIDATES = [
  'text-display-1',
  'text-h1',
  'text-h2',
  'text-h3',
  'text-h4',
  'text-body-lg',
  'text-body',
  'text-body-sm',
  'text-caption',
  'text-eyebrow',
  'text-pill',
  'text-button',
  'font-sans',
  'font-wordmark',
  'tracking-wordmark',
  'text-foreground',
  'text-copy',
  'text-muted',
  'text-primary',
  'text-accent',
  'text-on-primary',
  'bg-background',
  'bg-surface',
  'bg-surface-tint',
  'bg-surface-tint-2',
  'bg-surface-footer',
  'bg-icon-disc',
  'bg-primary',
  'bg-accent-fill',
  'border-border',
  'border-border-control',

  /**
   * Utilities whose namespace is easy to get wrong, listed because the form controls depend on
   * them and a missing one is invisible: an unstyled `accent-color` still shows a working
   * checkbox, just in the browser's blue, and an `outline-*` colour that emits nothing leaves
   * the focus ring at the browser default.
   */
  'accent-primary',
  'outline-focus-ring',
  'text-danger-700',
  'border-danger-500',
  'divide-border',
  'rounded-t-lg',

  'rounded-md',
  'rounded-lg',
  'rounded-pill',
  'shadow-xs',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shadow-card-hover',
  'duration-base',
  'ease-standard',
  'p-4',
  'p-6',
  'gap-2',
  'max-w-site',
  'h-header',
  'max-w-measure',
];

let css = '';

beforeAll(async () => {
  /**
   * `loadStylesheet` is what resolves the `@import "tailwindcss"` at the top of the token
   * file. Without it `compile` has no base layer and every utility comes back empty, which
   * would make this suite pass vacuously - the worst possible outcome for a test whose job
   * is to catch silent omissions.
   */
  const compiler = await compile(themeSource, {
    base: THEME_DIR,
    loadStylesheet: (id, base) => {
      const path = id === 'tailwindcss' ? resolveTailwindEntry() : join(base, id);

      return Promise.resolve({
        path,
        base: dirname(path),
        content: readFileSync(path, 'utf8'),
      });
    },
  });

  css = compiler.build(CANDIDATES);
});

/** The `tailwindcss` package's own `index.css`, which `@import "tailwindcss"` refers to. */
function resolveTailwindEntry(): string {
  return fileURLToPath(import.meta.resolve('tailwindcss/index.css'));
}

describe('the @theme block compiles', () => {
  it('produces a stylesheet', () => {
    expect(css.length).toBeGreaterThan(1000);
  });

  it.each(CANDIDATES)('emits a rule for %s', (candidate) => {
    // Tailwind escapes the dot in `text-display-1`? No - but it does escape nothing here,
    // so a plain substring check on the selector is enough.
    expect(css).toContain(`.${candidate.replaceAll('.', '\\.')}`);
  });
});

describe('type steps carry every property, not just the size', () => {
  /**
   * The silent-failure case. Each of these is asserted individually because a step missing
   * its line-height is invisible in review and subtle on the page.
   */
  const STEPS = [
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

  it.each(STEPS)('text-%s sets a line-height', (step) => {
    const rule = ruleFor(`text-${step}`);

    expect(rule, `no rule emitted for text-${step}`).not.toBe('');
    expect(rule).toMatch(/line-height/);
  });

  it.each(STEPS)('text-%s sets a font-weight', (step) => {
    expect(ruleFor(`text-${step}`)).toMatch(/font-weight/);
  });

  it.each(['display-1', 'h1', 'h2', 'h3', 'eyebrow', 'pill', 'button'])(
    'text-%s sets letter-spacing',
    (step) => {
      expect(ruleFor(`text-${step}`)).toMatch(/letter-spacing/);
    },
  );

  it('keeps the fluid clamp on the steps that scale', () => {
    // Asserted against the token declaration rather than the utility body. Tailwind emits
    // `font-size: var(--text-h1)` and puts the clamp in the theme variable, so looking for
    // `clamp(` inside the utility finds nothing even when the token is correct.
    for (const step of ['display-1', 'h1', 'h2', 'h3']) {
      expect(declarationOf(`--text-${step}`), `text-${step} lost its clamp()`).toMatch(/clamp\(/);
    }
  });

  it('keeps the non-fluid steps fixed', () => {
    // body and below are deliberately not fluid: fluid body text changes measure as the
    // window resizes, which is worse than a fixed size at every width.
    for (const step of ['h4', 'body-lg', 'body', 'body-sm', 'caption']) {
      expect(declarationOf(`--text-${step}`), `text-${step} should not be fluid`).not.toMatch(
        /clamp\(/,
      );
    }
  });
});

describe('utility namespaces do not collide', () => {
  /**
   * The bug this catches cost real time to find, and it is invisible in review.
   *
   * Tailwind builds `text-*` from two namespaces: `--text-*` for font size and `--color-*`
   * for colour. Declaring both `--text-body` and `--color-body` produces two `.text-body`
   * rules, one wins, and a component asking for body *type* silently receives a colour
   * instead - which looks right wherever the inherited font size happened to match.
   *
   * Generalised rather than pinned to the pair that was actually wrong, so the next one
   * fails here instead of on a page.
   */
  it('shares no name between the font-size and colour namespaces', () => {
    const raw = readRawTokens(themeSource);

    const sizes = new Set(
      [...raw.keys()]
        .filter((name) => name.startsWith('--text-') && !name.includes('--', 2))
        .map((name) => name.slice('--text-'.length)),
    );

    const colours = new Set(
      [...raw.keys()]
        .filter((name) => name.startsWith('--color-'))
        .map((name) => name.slice('--color-'.length)),
    );

    const collisions = [...sizes].filter((name) => colours.has(name));

    expect(
      collisions,
      `--text-${collisions[0] ?? 'x'} and --color-${collisions[0] ?? 'x'} both generate ` +
        `.text-${collisions[0] ?? 'x'}. Rename one.`,
    ).toEqual([]);
  });

  /**
   * `cn.ts` has to restate the token names, because it runs in the browser and cannot read
   * this file. That duplication is the risk these two tests remove.
   *
   * The consequence of drift is not a missing style - it is `tailwind-merge` silently
   * discarding a class. A font-size token absent from its list is treated as a colour, so
   * `cn('text-button', 'text-copy')` returns only the colour and the size vanishes from
   * every button. Nothing errors; the page just looks slightly wrong.
   */
  it('lists every font-size token in cn.ts', () => {
    const declared = [...readRawTokens(themeSource).keys()]
      .filter((name) => name.startsWith('--text-') && !name.includes('--', 2))
      .map((name) => name.slice('--text-'.length))
      .sort();

    expect([...FONT_SIZE_TOKENS].sort()).toEqual(declared);
  });

  it('lists every semantic colour token in cn.ts', () => {
    /**
     * Ramp steps are excluded deliberately: `tailwind-merge` already recognises the
     * `name-500` shape, so listing sixty of them would be noise that hides a real omission.
     *
     * Matched by naming the ramp families rather than by "ends in a number", because
     * `surface-tint-2` is a semantic token that ends in a number and must stay in the list.
     */
    const RAMP_STEP = /^(?:navy|primary|teal|neutral|success|warning|danger)-\d+$/;

    const declared = [...readRawTokens(themeSource).keys()]
      .filter((name) => name.startsWith('--color-'))
      .map((name) => name.slice('--color-'.length))
      .filter((name) => !RAMP_STEP.test(name))
      .sort();

    expect([...COLOR_TOKENS].sort()).toEqual(declared);
  });

  it('keeps every type step reachable as a font-size utility', () => {
    // The other half of the same property: the collision test proves no name is taken twice,
    // and this proves each one still emits what it should.
    for (const step of ['display-1', 'h1', 'h2', 'h3', 'h4', 'body', 'body-sm', 'caption']) {
      expect(ruleFor(`text-${step}`), `text-${step} emits no font-size`).toMatch(/font-size/);
    }
  });
});

describe('the spacing scale derives from the 4px base', () => {
  it('makes p-4 resolve to 16px', () => {
    // `--spacing: 4px` with Tailwind's multiplication. Asserted because getting this wrong
    // by a factor of four rescales every margin in the application at once.
    expect(ruleFor('p-4')).toMatch(/calc\(var\(--spacing\)\s*\*\s*4\)/);
  });

  it('exposes the header height and container as named tokens', () => {
    expect(ruleFor('h-header')).toMatch(/--spacing-header/);
    expect(ruleFor('max-w-site')).toMatch(/--container-site/);
  });
});

describe('semantic colour tokens resolve to the ramp', () => {
  const tokens = readColorTokens(themeSource);

  it('points foreground at the navy anchor', () => {
    expect(tokens.get('foreground')).toBe(tokens.get('navy-900'));
  });

  it('points copy at the sampled body-text anchor', () => {
    expect(tokens.get('copy')).toBe(tokens.get('neutral-700'));
  });

  it('points primary at the sampled button fill', () => {
    expect(tokens.get('primary')).toBe('#0a5378');
  });

  it('resolves every semantic token to a literal, leaving no var() behind', () => {
    // A `var()` surviving resolution means a token references a name that does not exist,
    // and the utility then emits `color: var(--color-typo)` - which computes to nothing and
    // renders as inherited text, not as an error.
    for (const [name, value] of readResolvedTokens(themeSource)) {
      expect(value, `${name} still contains an unresolved var()`).not.toMatch(/var\(/);
    }
  });

  it('declares every colour as hex, so the contrast gate can read all of them', () => {
    // The gate skips anything it cannot parse. A token written as `oklch()` would be skipped
    // silently and so go unverified - passing by omission.
    for (const [name, value] of readRawTokens(themeSource)) {
      if (!name.startsWith('--color-')) continue;
      if (value.startsWith('var(')) continue;

      expect(value, `${name} is not a hex literal`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('reduced motion is neutralised globally', () => {
  it('suppresses animation, transition, and smooth scrolling', () => {
    const block = themeSource.slice(themeSource.indexOf('prefers-reduced-motion'));

    expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });

  it('uses 0.01ms rather than 0s', () => {
    // A zero duration stops `transitionend` firing in some engines, so cleanup code that
    // waits for it never runs. The distinction is easy to "simplify" away.
    const block = themeSource.slice(themeSource.indexOf('prefers-reduced-motion'));

    expect(block).not.toMatch(/animation-duration:\s*0s/);
  });
});

describe('forced colours keeps controls perceivable', () => {
  it('restores a focus outline in system colours', () => {
    const block = themeSource.slice(themeSource.indexOf('forced-colors'));

    expect(block).toMatch(/outline:\s*2px solid CanvasText/);
  });
});

/** The declared value of a theme variable in the compiled output. */
function declarationOf(name: string): string {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);

  return match?.[1] ?? '';
}

/** The body of the first rule whose selector is exactly this utility. */
function ruleFor(candidate: string): string {
  const selector = `.${candidate}`;
  const index = css.indexOf(`${selector} {`);

  if (index === -1) return '';

  const open = css.indexOf('{', index);
  const close = css.indexOf('}', open);

  return css.slice(open + 1, close);
}
