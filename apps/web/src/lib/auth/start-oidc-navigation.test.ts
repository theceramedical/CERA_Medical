import { afterEach, describe, expect, it, vi } from 'vitest';

import { startOidcNavigation } from './start-oidc-navigation.ts';

afterEach(() => vi.unstubAllGlobals());

describe('startOidcNavigation', () => {
  it('navigates on the current origin with next and provider', () => {
    const assign = vi.fn();
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:3100', assign },
    });

    startOidcNavigation('/account', 'google');

    const target = assign.mock.calls[0]?.[0] as URL;
    expect(target.href).toBe('http://localhost:3100/auth/signin?next=%2Faccount&provider=google');
  });
});
