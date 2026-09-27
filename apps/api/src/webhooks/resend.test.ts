import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { advanceDelivery, verifySvix } from './resend.ts';

describe('advanceDelivery', () => {
  it('is monotonic and does not regress a bounce', () => {
    expect(advanceDelivery('queued', 'sent')).toBe('sent');
    expect(advanceDelivery('delivered', 'sent')).toBe('delivered');
    expect(advanceDelivery('bounced', 'delivered')).toBe('bounced');
  });
});

describe('verifySvix', () => {
  it('accepts a matching signature over the raw body', () => {
    const secret = 'whsec_test';
    const raw = '{"type":"email.delivered"}';
    const signature = `v1,${createHmac('sha256', secret).update(`id.1.${raw}`).digest('base64')}`;
    expect(verifySvix(secret, 'id', '1', raw, signature)).toBe(true);
    expect(verifySvix(secret, 'id', '1', raw, 'v1,nope')).toBe(false);
  });
});
