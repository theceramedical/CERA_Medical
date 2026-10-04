import { Alert } from '@cera/ui/alert';
import { Link } from '@cera/ui/link';
import { MainContent, SkipLink } from '@cera/ui/skip-link';
import { ToastProvider } from '@cera/ui/toast';
import { Heading, Text } from '@cera/ui/typography';
import { Wordmark } from '@cera/ui/wordmark';

import { assertDevOnly } from '../guard.ts';

import { CompositeSections } from './composites-section.tsx';
import { PrimitiveSections } from './primitives-section.tsx';
import { TokenSections } from './tokens-section.tsx';

import type { Metadata } from 'next';

/**
 * The design system preview - WP-03.7.
 *
 * Three jobs, in order of how much they are worth:
 *
 * 1. It is the Playwright and axe target for WP-03.8. Testing the design system on the homepage
 *    conflates two things: a violation could be the component or the composition, and a component
 *    with no instance on any built page is not covered at all. Here every component and every state
 *    has exactly one instance, so the axe run is a statement about the library.
 * 2. It makes token drift visible. Every value is read out of `theme.css` at request time, so a
 *    token renamed or re-valued shows up on the next reload rather than in a Phase 14 audit.
 * 3. It is where the contrast numbers live. The gate proves them in CI; this shows them beside the
 *    pairing they describe, which is what makes a marginal ratio an argument rather than a surprise.
 *
 * A server component. `tokens.ts` reads the filesystem, and the one island that needs state is
 * isolated in `interactive.tsx`.
 */

export const metadata: Metadata = {
  title: 'Design system',
  /**
   * Not indexable, belt and braces alongside the 404 in production.
   *
   * The guard already makes this unreachable there, so this only matters if the guard is ever
   * loosened - which is exactly the change that would otherwise put a page of component fixtures
   * into search results under the clinic's name.
   */
  robots: { index: false, follow: false },
};

/**
 * Rendered per request rather than prerendered.
 *
 * `readColorTokens` reads `theme.css` from disk. Statically rendering this would freeze the values
 * at build time and quietly turn the preview back into the second source of truth it exists to
 * replace.
 */
export const dynamic = 'force-dynamic';

export default function DesignSystemPage() {
  assertDevOnly();

  return (
    <ToastProvider>
      {/*
        The skip link is real, not a demonstration. This page is long enough that tabbing past the
        contents list to reach a component is genuinely tedious, which is the case SC 2.4.1 is about.
      */}
      <SkipLink />

      <div className="min-h-dvh bg-background">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-(--container-site) flex-wrap items-center justify-between gap-4 px-6 py-5">
            <Wordmark size="md" />
            <Text size="caption" tone="muted">
              Design system preview - development only
            </Text>
          </div>
        </header>

        <MainContent className="mx-auto max-w-(--container-site) px-6 py-10">
          <Heading level={1} size="h1">
            Design system
          </Heading>
          <Text size="body-lg" tone="muted" measure className="mt-3">
            Every token, type step, primitive, composite, and state in the library, with the
            measured contrast ratio beside each pairing. Values are parsed from{' '}
            <code>theme.css</code> on each request, so this page cannot describe a design system
            that no longer exists.
          </Text>

          <Alert tone="info" title="This page is not part of the site" className="mt-6">
            It returns 404 in production and carries a noindex. Phase 13 blocks <code>/dev/*</code>{' '}
            at the edge as well, so the request never reaches the app.
          </Alert>

          <Contents />

          <div className="mt-12 flex min-w-0 flex-col gap-12">
            <TokenSections />
            <PrimitiveSections />
            <CompositeSections />
          </div>
        </MainContent>
      </div>
    </ToastProvider>
  );
}

/**
 * The contents list.
 *
 * A `nav` with a real list, not a row of styled links. On a page this long the contents is the
 * primary means of navigation, and a screen reader user needs to know how many sections there are
 * before committing to reading them - which is what a list conveys and a `div` of anchors does not.
 */
const SECTIONS: readonly (readonly [id: string, label: string])[] = [
  ['colour', 'Colour'],
  ['contrast', 'Contrast'],
  ['type', 'Type scale'],
  ['scales', 'Other scales'],
  ['actions', 'Buttons and links'],
  ['forms', 'Form controls'],
  ['feedback', 'Feedback'],
  ['surfaces', 'Surfaces'],
  ['navigation', 'Navigation'],
  ['data', 'Table'],
  ['composites', 'Composites'],
  ['process', 'Process steps'],
  ['section-headers', 'Section header'],
  ['status', 'Status and timeline'],
  ['brand', 'Brand and artwork'],
];

function Contents() {
  return (
    <nav aria-labelledby="contents-heading" className="mt-10">
      <Heading level={2} size="h4" id="contents-heading">
        Contents
      </Heading>
      <ol className="mt-3 grid min-w-0 list-none grid-cols-1 gap-y-1 p-0 min-[28rem]:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
        {SECTIONS.map(([id, label]) => (
          <li key={id}>
            <Link href={`#${id}`}>{label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
