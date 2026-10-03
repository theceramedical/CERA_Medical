import { describe, expect, it } from 'vitest';

import { assertCatalogueSeedAllowed } from './seed-environment.ts';

describe('assertCatalogueSeedAllowed', () => {
  it('allows local and test catalogue seeding', () => {
    expect(() =>
      assertCatalogueSeedAllowed({ CERA_ENV: 'local', NODE_ENV: 'development' }),
    ).not.toThrow();
  });

  it('blocks production unless deployment explicitly approves the one-shot seed', () => {
    expect(() => assertCatalogueSeedAllowed({ CERA_ENV: 'production' })).toThrow(
      'Refusing to seed production',
    );
    expect(() =>
      assertCatalogueSeedAllowed({
        CERA_ENV: 'production',
        NODE_ENV: 'production',
        CERA_ALLOW_PRODUCTION_CATALOGUE_SEED: 'approved',
      }),
    ).not.toThrow();
  });
});
