import { STAFF_ROLES, type Role } from '@cera/contracts';

export type RoutePolicy =
  | { kind: 'public' }
  | { kind: 'signature' }
  | { kind: 'staff'; roles: readonly Role[]; mfa?: boolean };

export interface RouteDeclaration {
  readonly method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly policy: RoutePolicy;
}

/**
 * Every API route must appear here. A route with no policy is unreachable, and
 * the authz matrix fails CI if the live table drifts from this list.
 */
export const ROUTE_POLICIES: readonly RouteDeclaration[] = [
  { method: 'GET', path: '/health', policy: { kind: 'public' } },
  { method: 'GET', path: '/health/ready', policy: { kind: 'public' } },
  { method: 'GET', path: '/v1/services', policy: { kind: 'public' } },
  { method: 'GET', path: '/v1/services/:slug', policy: { kind: 'public' } },
  { method: 'GET', path: '/v1/products', policy: { kind: 'public' } },
  { method: 'GET', path: '/v1/products/:sku', policy: { kind: 'public' } },
  { method: 'GET', path: '/v1/search', policy: { kind: 'public' } },
  { method: 'POST', path: '/v1/enquiries', policy: { kind: 'public' } },
  { method: 'GET', path: '/v1/cart', policy: { kind: 'public' } },
  { method: 'POST', path: '/v1/cart/lines', policy: { kind: 'public' } },
  { method: 'POST', path: '/v1/checkout/complete', policy: { kind: 'public' } },
  // Retired payment-provider endpoint. Keep public so old clients receive the route's 410.
  { method: 'POST', path: '/v1/checkout/safepay/start', policy: { kind: 'public' } },
  { method: 'POST', path: '/v1/webhooks/resend', policy: { kind: 'signature' } },
  { method: 'GET', path: '/v1/ops/enquiries', policy: { kind: 'staff', roles: STAFF_ROLES } },
  { method: 'GET', path: '/v1/ops/enquiries/:id', policy: { kind: 'staff', roles: STAFF_ROLES } },
  {
    method: 'PATCH',
    path: '/v1/ops/enquiries/:id/assign',
    policy: { kind: 'staff', roles: ['enquiry_handler', 'operations_manager', 'administrator'] },
  },
  {
    method: 'POST',
    path: '/v1/ops/enquiries/:id/transition',
    policy: { kind: 'staff', roles: ['enquiry_handler', 'operations_manager', 'administrator'] },
  },
  {
    method: 'GET',
    path: '/v1/ops/enquiries/:id/notes',
    policy: { kind: 'staff', roles: STAFF_ROLES },
  },
  {
    method: 'POST',
    path: '/v1/ops/enquiries/:id/notes',
    policy: { kind: 'staff', roles: ['enquiry_handler', 'operations_manager', 'administrator'] },
  },
  {
    method: 'GET',
    path: '/v1/ops/enquiries/:id/audit',
    policy: { kind: 'staff', roles: STAFF_ROLES },
  },
  { method: 'GET', path: '/v1/ops/deliveries', policy: { kind: 'staff', roles: STAFF_ROLES } },
  {
    method: 'POST',
    path: '/v1/ops/deliveries/:id/retry',
    // Production staff authentication is password-only; keep this operation
    // administrator-only without requiring a second factor the live flow
    // does not collect.
    policy: { kind: 'staff', roles: ['administrator'] },
  },
];

export function matchRoute(method: string, path: string): RouteDeclaration | null {
  const normalised = path.replace(/\/$/, '') || '/';
  return (
    ROUTE_POLICIES.find(
      (route) => route.method === method && patternMatches(route.path, normalised),
    ) ?? null
  );
}

function patternMatches(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, index) => part.startsWith(':') || part === pathParts[index]);
}
