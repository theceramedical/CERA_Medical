import { describe, expect, it } from 'vitest';

import { allowOrFailOpen, memoryRateLimiter } from './rate-limit.ts';

describe('memoryRateLimiter', () => {
  it('limits after the window is exceeded', async () => {
    const limiter = memoryRateLimiter();
    expect((await limiter.hit('k', 1, 60_000)).limited).toBe(false);
    expect((await limiter.hit('k', 1, 60_000)).limited).toBe(true);
  });

  it('fails open when the store throws', async () => {
    const alerts: unknown[] = [];
    const decision = await allowOrFailOpen(
      {
        hit() {
          return Promise.reject(new Error('valkey down'));
        },
      },
      'k',
      1,
      1000,
      (error) => {
        alerts.push(error);
      },
    );
    expect(decision.limited).toBe(false);
    expect(alerts).toHaveLength(1);
  });
});
