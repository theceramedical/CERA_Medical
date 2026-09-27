import type { Role } from '@cera/contracts';

/**
 * Authentik group names → platform roles. Unknown groups are ignored, never
 * mapped to administrator.
 */
export const GROUP_TO_ROLE = {
  'cera-customers': 'customer',
  'cera-content-editors': 'content_editor',
  'cera-content-approvers': 'content_approver',
  'cera-enquiry-handlers': 'enquiry_handler',
  'cera-operations-managers': 'operations_manager',
  'cera-administrators': 'administrator',
  'cera-auditors': 'auditor',
} as const satisfies Record<string, Role>;

export function rolesFromGroups(groups: readonly string[]): Role[] {
  const roles = new Set<Role>();
  const known = GROUP_TO_ROLE as Record<string, Role | undefined>;
  for (const group of groups) {
    const role = known[group];
    if (role !== undefined) roles.add(role);
  }
  return [...roles];
}
