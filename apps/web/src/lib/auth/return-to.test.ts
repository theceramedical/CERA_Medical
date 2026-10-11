import { describe, expect, it } from 'vitest';

import { customerReturnTo, isStaffReturnTo, safeReturnTo } from './return-to.ts';

describe('safeReturnTo', () => {
  it('accepts a relative path and rejects an absolute URL', () => {
    expect(safeReturnTo('/account/enquiries')).toBe('/account/enquiries');
    expect(safeReturnTo('https://evil.example/phish')).toBe('/account');
    expect(safeReturnTo('//evil.example')).toBe('/account');
  });
});

describe('staff return targets', () => {
  it('recognises only the staff workspace and keeps customer enrollment out of it', () => {
    expect(isStaffReturnTo('/staff')).toBe(true);
    expect(isStaffReturnTo('/staff/enquiries/42')).toBe(true);
    expect(isStaffReturnTo('/staffing')).toBe(false);
    expect(customerReturnTo('/staff')).toBe('/account');
    expect(customerReturnTo('/account')).toBe('/account');
  });
});
