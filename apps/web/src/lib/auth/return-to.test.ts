import { describe, expect, it } from 'vitest';

import { isStaffReturnTo, safeReturnTo } from './return-to.ts';

describe('safeReturnTo', () => {
  it('accepts a relative path and rejects an absolute URL', () => {
    expect(safeReturnTo('/account/enquiries')).toBe('/account/enquiries');
    expect(safeReturnTo('https://evil.example/phish')).toBe('/staff');
    expect(safeReturnTo('//evil.example')).toBe('/staff');
  });
});

describe('staff return targets', () => {
  it('recognises only the staff workspace', () => {
    expect(isStaffReturnTo('/staff')).toBe(true);
    expect(isStaffReturnTo('/staff/enquiries/42')).toBe(true);
    expect(isStaffReturnTo('/staffing')).toBe(false);
  });
});
