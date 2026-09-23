import { articleFixtures, listableServiceFixtures, unmarkedAll } from '@cera/contracts/fixtures';
import { describe, expect, it } from 'vitest';

import { HOMEPAGE_ARTICLES, HOMEPAGE_SERVICES } from './homepage.ts';

/**
 * The homepage copy and the contract fixtures hold the same words, and this is what keeps them that
 * way.
 *
 * Both are transcribed from the reference image, and they are deliberately separate modules: the
 * fixture package states that nothing in it is imported by application code, because every fixture
 * carries a `Fixture` marker, test email domains, and synthetic subject ids that have no business in a
 * client bundle. That separation costs a duplicated set of strings.
 *
 * A test can import both where the application cannot, so the duplication is pinned rather than merely
 * regretted. Phase 06 will replace `HOMEPAGE_SERVICES` with the Vendure catalogue, and at that point
 * this file's job changes from "the two transcriptions agree" to "the catalogue matches the fixtures",
 * which is the same assertion pointed at a different source.
 */

describe('services', () => {
  const fixtures = unmarkedAll(listableServiceFixtures);

  it('names the same services the catalogue fixtures do', () => {
    // Slugs rather than titles, because a slug is what a URL is built from - a mismatch here is a
    // homepage card linking to a 404, which is the failure worth catching.
    expect(HOMEPAGE_SERVICES.map((service) => service.slug).sort()).toEqual(
      fixtures.map((service) => service.slug).sort(),
    );
  });

  it.each(HOMEPAGE_SERVICES)(
    'matches the fixture copy for $slug',
    ({ slug, title, description }) => {
      const fixture = fixtures.find((candidate) => candidate.slug === slug);

      expect(fixture).toBeDefined();
      expect(title).toBe(fixture?.title);
      // The card's description is the catalogue's summary. Two wordings for the same service is the
      // kind of inconsistency a reader notices and cannot explain.
      expect(description).toBe(fixture?.summary);
    },
  );

  it('has one icon per service, with no repeats', () => {
    // Six identical glyphs in a row conveys nothing, and a repeat is the likely outcome of adding a
    // service without thinking about its icon.
    const icons = new Set(HOMEPAGE_SERVICES.map((service) => service.icon));

    expect(icons.size).toBe(HOMEPAGE_SERVICES.length);
  });
});

describe('articles', () => {
  const fixtures = unmarkedAll(articleFixtures);

  it('links to slugs the content fixtures publish', () => {
    expect(HOMEPAGE_ARTICLES.map((article) => article.slug).sort()).toEqual(
      fixtures.map((article) => article.slug).sort(),
    );
  });

  it.each(HOMEPAGE_ARTICLES)('matches the fixture copy for $slug', ({ slug, title, excerpt }) => {
    const fixture = fixtures.find((candidate) => candidate.slug === slug);

    expect(fixture).toBeDefined();
    expect(title).toBe(fixture?.title);
    expect(excerpt).toBe(fixture?.excerpt);
  });
});
