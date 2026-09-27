import { describe, expect, it } from 'vitest';

import { assertServiceExists, REFERENCE_SERVICE_SLUGS, UnknownServiceError } from './catalogue.ts';

describe('assertServiceExists', () => {
  it('accepts every reference-image service', async () => {
    for (const slug of REFERENCE_SERVICE_SLUGS) {
      await expect(assertServiceExists(slug)).resolves.toBeUndefined();
    }
  });

  it('rejects the withdrawn service and anything unknown', async () => {
    await expect(assertServiceExists('travel-vaccinations')).rejects.toThrow(UnknownServiceError);
    await expect(assertServiceExists('does-not-exist')).rejects.toThrow(/does not exist/);
  });

  it('honours an injected lookup, which is how Phase 06 replaces the list', async () => {
    await expect(assertServiceExists('travel-vaccinations', () => true)).resolves.toBeUndefined();
    await expect(assertServiceExists('cardiology', () => false)).rejects.toThrow(
      UnknownServiceError,
    );
  });
});
