import { STAFF_ROLES, type Role } from '@cera/contracts';

export function rolesIncludeStaff(roles: readonly Role[]): boolean {
  return roles.some((role) => STAFF_ROLES.includes(role));
}
