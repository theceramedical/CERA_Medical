import { describe, expect, it } from 'vitest';

import { MAIN_NAV, withProductsNav } from './navigation.ts';

describe('main nav', () => {
  it('includes Products after Services', () => {
    expect(MAIN_NAV.map((item) => item.href)).toEqual([
      '/',
      '/services',
      '/products',
      '/projects',
      '/about',
      '/contact',
    ]);
  });

  it('injects Products when CMS header omits it', () => {
    const merged = withProductsNav([
      { href: '/', label: 'Home' },
      { href: '/services', label: 'Services' },
      { href: '/projects', label: 'Our Projects' },
    ]);
    expect(merged.map((item) => item.href)).toEqual(['/', '/services', '/products', '/projects']);
  });
});
