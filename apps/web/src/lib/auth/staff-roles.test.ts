import { describe, expect, it } from 'vitest';

import { rolesIncludeStaff } from './staff-roles.ts';

describe('rolesIncludeStaff', () => {
  it('is false for customers only', () => {
    expect(rolesIncludeStaff(['customer'])).toBe(false);
  });

  it('is true for enquiry handlers', () => {
    expect(rolesIncludeStaff(['enquiry_handler', 'customer'])).toBe(true);
  });
});
