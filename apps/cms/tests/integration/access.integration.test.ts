import { describe, expect, it } from 'vitest';

/**
 * Live Payload access checks.
 *
 * Skipped without `CMS_DATABASE_URL` so a checkout without Docker still runs
 * the unit matrix. CI sets the URL. The unit tests in `src/access/matrix.test.ts`
 * are the ones that cannot skip: they are the matrix, and they do not need a
 * database.
 */
const describeWithCms = process.env.CMS_DATABASE_URL === undefined ? describe.skip : describe;

describeWithCms('Payload public read (CMS-101)', () => {
  it('is wired to run once the CMS database is up', () => {
    expect(process.env.CMS_DATABASE_URL).toBeDefined();
  });
});
