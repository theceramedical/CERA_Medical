import { describe, expect, it } from 'vitest';

import { formatPakistanDateTime } from './format-pakistan-time.ts';

describe('formatPakistanDateTime', () => {
  it('renders UTC storage as Pakistan time with an explicit zone label', () => {
    expect(formatPakistanDateTime('2026-10-15T08:00:00.000Z')).toBe('15 Oct 2026, 13:00 PKT');
  });
});
