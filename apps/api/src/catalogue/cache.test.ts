import { describe, expect, it } from 'vitest';

import { memoryCatalogueCache } from './cache.ts';

describe('memoryCatalogueCache', () => {
  it('expires entries after the TTL', async () => {
    let now = 0;
    const cache = memoryCatalogueCache(() => now);

    await cache.set('k', 'v', 1);
    expect(await cache.get('k')).toBe('v');

    now = 1001;
    expect(await cache.get('k')).toBeNull();
  });
});
