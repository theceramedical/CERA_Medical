import { describe, expect, it } from 'vitest';

import { assertTransition } from './status.ts';

describe('assertTransition', () => {
  it('allows a documented transition', () => {
    expect(() => assertTransition('received', 'triaging')).not.toThrow();
  });

  it('rejects an impossible jump and names the permitted next states', () => {
    expect(() => assertTransition('received', 'completed')).toThrow();
    try {
      assertTransition('received', 'completed');
    } catch (error) {
      expect(error).toMatchObject({
        code: 'invalid_transition',
        fieldErrors: [{ path: 'status', message: expect.stringContaining('triaging') }],
      });
    }
  });

  it('rejects every outgoing transition from a terminal status', () => {
    expect(() => assertTransition('completed', 'in_progress')).toThrow();
  });
});
