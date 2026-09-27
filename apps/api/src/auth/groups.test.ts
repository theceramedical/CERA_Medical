import { describe, expect, it } from 'vitest';

import { rolesFromGroups } from './groups.ts';

describe('rolesFromGroups', () => {
  it('maps known Authentik groups and ignores unknown ones', () => {
    expect(rolesFromGroups(['cera-customers', 'cera-unknown'])).toEqual(['customer']);
  });

  it('never promotes an unknown group to administrator', () => {
    expect(rolesFromGroups(['admins', 'superuser'])).toEqual([]);
  });
});
