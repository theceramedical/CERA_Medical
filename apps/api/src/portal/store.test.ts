import { hashToken, toCustomerEnquiry } from '@cera/contracts';
import { describe, expect, it } from 'vitest';

import {
  consumeClaimToken,
  emailHashOf,
  issueClaimToken,
  memoryPortalStore,
  projectPortalEnquiry,
  type PortalEnquiry,
} from './store.ts';

function sample(overrides: Partial<PortalEnquiry> = {}): PortalEnquiry {
  return {
    id: 'enq-1',
    reference: 'CERA-260101-AAAAA',
    email: 'a@example.com',
    emailHash: emailHashOf('a@example.com'),
    serviceTitle: 'Cardiology',
    message: 'I would like to know about a first appointment.',
    internalStatus: 'referred',
    ownerId: 'staff-1',
    notes: ['Called the GP. Internal only.'],
    customerSubjectId: null,
    createdAt: '2026-01-05T09:00:00.000Z',
    updatedAt: '2026-01-05T10:00:00.000Z',
    ...overrides,
  };
}

describe('claim tokens', () => {
  it('lets the matching verified subject consume a token once', () => {
    const store = memoryPortalStore();
    const enquiry = sample();
    store.putEnquiry(enquiry);
    const token = issueClaimToken(store, enquiry, Date.parse('2026-01-05T10:00:00.000Z'));
    expect(hashToken(token)).toHaveLength(64);

    const first = consumeClaimToken(
      store,
      token,
      'cust-a',
      emailHashOf('a@example.com'),
      Date.parse('2026-01-05T10:05:00.000Z'),
    );
    const second = consumeClaimToken(
      store,
      token,
      'cust-a',
      emailHashOf('a@example.com'),
      Date.parse('2026-01-05T10:06:00.000Z'),
    );
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('rejects a token presented by a different email', () => {
    const store = memoryPortalStore();
    const enquiry = sample();
    store.putEnquiry(enquiry);
    const token = issueClaimToken(store, enquiry);
    expect(consumeClaimToken(store, token, 'cust-b', emailHashOf('b@example.com'))).toBe(false);
  });
});

describe('customer projection leak', () => {
  it('never includes notes, owner, or staff-only statuses', () => {
    const view = projectPortalEnquiry(sample({ customerSubjectId: 'cust-a' }));
    const serialised = JSON.stringify(view);
    expect(serialised).not.toContain('Called the GP');
    expect(serialised).not.toContain('staff-1');
    expect(serialised).not.toContain('referred');
    expect(view.status).toBe('in_progress');
    expect(toCustomerEnquiry).toBeTypeOf('function');
  });
});
