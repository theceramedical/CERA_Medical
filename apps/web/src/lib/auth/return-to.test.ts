import { describe, expect, it } from 'vitest';

import { safeReturnTo } from './return-to.ts';

describe('safeReturnTo', () => {
  it('accepts a relative path and rejects an absolute URL', () => {
    expect(safeReturnTo('/account/enquiries')).toBe('/account/enquiries');
    expect(safeReturnTo('https://evil.example/phish')).toBe('/account');
    expect(safeReturnTo('//evil.example')).toBe('/account');
  });
});
