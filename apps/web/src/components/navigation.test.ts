import { describe, expect, it } from 'vitest';

import { MAIN_NAV, withProductsNav } from './navigation.ts';

describe('main nav', () => {
  it('includes the approved top-level destinations', () => {
    expect(MAIN_NAV.map((item) => item.href)).toEqual([
      '/',
      '/services',
      '/products',
      '/projects',
      '/about',
      '/contact',
    ]);
  });

  it('preserves caller-provided navigation items', () => {
    const merged = withProductsNav([
      { href: '/', label: 'Home' },
      { href: '/services', label: 'Services' },
      { href: '/articles', label: 'Research Updates' },
    ]);
    expect(merged.map((item) => item.href)).toEqual(['/', '/services', '/articles']);
  });
});
