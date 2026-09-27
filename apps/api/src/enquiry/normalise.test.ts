import { describe, expect, it } from 'vitest';

import { contentFingerprint, normaliseEnquiry, stripUnsafe } from './normalise.ts';

describe('normaliseEnquiry', () => {
  it('collapses whitespace, lowercases email, and strips zero-width characters', () => {
    const normalised = normaliseEnquiry({
      name: '  Alex\u200B Patient  ',
      email: 'Alex@Example.COM',
      serviceId: 'cardiology',
      message: 'Please  tell me  more.',
      consent: true,
      source: 'web_general',
    });
    expect(normalised.name).toBe('Alex Patient');
    expect(normalised.email).toBe('alex@example.com');
    expect(normalised.message).toBe('Please tell me more.');
  });

  it('fingerprints the normalised values so a trailing space collides', () => {
    const a = normaliseEnquiry({
      name: 'Alex',
      email: 'alex@example.com',
      serviceId: 'cardiology',
      message: 'Please tell me more.',
      consent: true,
      source: 'web_general',
    });
    const b = normaliseEnquiry({
      name: 'Alex',
      email: 'alex@example.com',
      serviceId: 'cardiology',
      message: 'Please tell me more. ',
      consent: true,
      source: 'web_general',
    });
    expect(contentFingerprint(a)).toBe(contentFingerprint(b));
  });

  it('strips control characters', () => {
    expect(stripUnsafe('hello\u0007 world')).toBe('hello world');
  });
});
