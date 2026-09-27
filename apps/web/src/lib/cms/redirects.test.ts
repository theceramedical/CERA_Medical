import { describe, expect, it } from 'vitest';

import { resolveRedirect } from './redirects.ts';

describe('resolveRedirect', () => {
  it('follows a single hop', () => {
    expect(resolveRedirect('/old', [{ from: '/old', to: '/about', permanent: true }])).toEqual({
      from: '/old',
      to: '/about',
      permanent: true,
    });
  });

  it('refuses a loop', () => {
    expect(
      resolveRedirect('/a', [
        { from: '/a', to: '/b', permanent: true },
        { from: '/b', to: '/a', permanent: true },
      ]),
    ).toBeNull();
  });
});
