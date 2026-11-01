import { describe, expect, it } from 'vitest';

import { rolesFromGroups } from './groups.ts';

describe('rolesFromGroups', () => {
  it('ignores retired customer and unknown groups but maps approved staff groups', () => {
    expect(rolesFromGroups(['cera-customers', 'cera-unknown'])).toEqual([]);
    expect(rolesFromGroups(['cera-enquiry-handlers'])).toEqual(['enquiry_handler']);
  });

  it('never promotes an unknown group to administrator', () => {
    expect(rolesFromGroups(['admins', 'superuser'])).toEqual([]);
  });
});
