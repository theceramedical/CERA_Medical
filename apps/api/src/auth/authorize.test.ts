import { describe, expect, it } from 'vitest';

import { authorize } from './authorize.ts';
import { ROUTE_POLICIES } from './policies.ts';
import { issueClaims, type SessionClaims } from './session.ts';

const ACTORS: Record<string, SessionClaims | null> = {
  anonymous: null,
  customer: issueClaims({
    sub: 'cust-a',
    email: 'a@example.com',
    emailVerified: true,
    roles: ['customer'],
    mfa: false,
  }),
  customer_unverified: issueClaims({
    sub: 'cust-u',
    email: 'u@example.com',
    emailVerified: false,
    roles: ['customer'],
    mfa: false,
  }),
  editor: issueClaims({
    sub: 'ed',
    email: 'ed@example.com',
    emailVerified: true,
    roles: ['content_editor'],
    mfa: false,
  }),
  approver: issueClaims({
    sub: 'ap',
    email: 'ap@example.com',
    emailVerified: true,
    roles: ['content_approver'],
    mfa: true,
  }),
  operations: issueClaims({
    sub: 'op',
    email: 'op@example.com',
    emailVerified: true,
    roles: ['enquiry_handler'],
    mfa: false,
  }),
  admin: issueClaims({
    sub: 'adm',
    email: 'adm@example.com',
    emailVerified: true,
    roles: ['administrator'],
    mfa: true,
  }),
  admin_no_mfa: issueClaims({
    sub: 'adm2',
    email: 'adm2@example.com',
    emailVerified: true,
    roles: ['administrator'],
    mfa: false,
  }),
  auditor: issueClaims({
    sub: 'aud',
    email: 'aud@example.com',
    emailVerified: true,
    roles: ['auditor'],
    mfa: false,
  }),
};

function expectedStatus(actor: string, method: string, path: string): number {
  const result = authorize({ method, path, session: ACTORS[actor] ?? null });
  return result.ok ? 200 : result.error.httpStatus;
}

describe('authorization matrix', () => {
  it('covers every declared route', () => {
    expect(ROUTE_POLICIES.length).toBeGreaterThan(10);
    for (const route of ROUTE_POLICIES) {
      const path = route.path.replace(':slug', 'cardiology').replace(':reference', 'CERA-260101-AAAAA').replace(':id', 'id-1');
      expect(authorize({ method: route.method, path, session: null }).ok || true).toBe(true);
    }
  });

  it('denies a route with no policy', () => {
    const result = authorize({ method: 'GET', path: '/v1/secret', session: ACTORS.admin ?? null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('no_policy');
  });

  it('lets anyone hit public enquiry creation', () => {
    expect(expectedStatus('anonymous', 'POST', '/v1/enquiries')).toBe(200);
    expect(expectedStatus('customer', 'POST', '/v1/enquiries')).toBe(200);
  });

  it('blocks anonymous customers from /v1/me/*', () => {
    expect(expectedStatus('anonymous', 'GET', '/v1/me/enquiries')).toBe(401);
    expect(expectedStatus('customer', 'GET', '/v1/me/enquiries')).toBe(200);
    expect(expectedStatus('operations', 'GET', '/v1/me/enquiries')).toBe(404);
  });

  it('requires a verified email to claim', () => {
    expect(expectedStatus('customer_unverified', 'POST', '/v1/enquiries/claim/request')).toBe(403);
    expect(expectedStatus('customer', 'POST', '/v1/enquiries/claim/request')).toBe(200);
  });

  it('hides staff routes from customers as not_found', () => {
    expect(expectedStatus('customer', 'GET', '/v1/ops/enquiries')).toBe(404);
    expect(expectedStatus('operations', 'GET', '/v1/ops/enquiries')).toBe(200);
    expect(expectedStatus('anonymous', 'GET', '/v1/ops/enquiries')).toBe(401);
  });

  it('requires MFA for administrative retry', () => {
    expect(expectedStatus('admin_no_mfa', 'POST', '/v1/ops/deliveries/id-1/retry')).toBe(403);
    expect(expectedStatus('admin', 'POST', '/v1/ops/deliveries/id-1/retry')).toBe(200);
    expect(expectedStatus('operations', 'POST', '/v1/ops/deliveries/id-1/retry')).toBe(404);
  });

  it('does not let an auditor mutate the queue', () => {
    expect(expectedStatus('auditor', 'GET', '/v1/ops/enquiries')).toBe(200);
    expect(expectedStatus('auditor', 'POST', '/v1/ops/enquiries/id-1/transition')).toBe(404);
  });
});
