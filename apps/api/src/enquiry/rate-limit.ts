/**
 * In-process rate limits that fail open.
 *
 * Valkey is the production store (Phase 10). When it is absent the counters
 * live here so the contract is still testable; when the store throws, the
 * request is allowed and an alert hook fires, because refusing every enquiry
 * is worse than briefly losing the limiter.
 */

export interface RateLimitDecision {
  readonly limited: boolean;
  readonly retryAfterSeconds: number;
}

export interface RateLimiter {
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitDecision>;
}

export function memoryRateLimiter(): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    hit(key, limit, windowMs) {
      const now = Date.now();
      const existing = buckets.get(key);
      if (existing === undefined || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return Promise.resolve({ limited: false, retryAfterSeconds: 0 });
      }
      existing.count += 1;
      if (existing.count > limit) {
        return Promise.resolve({
          limited: true,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
        });
      }
      return Promise.resolve({ limited: false, retryAfterSeconds: 0 });
    },
  };
}

export async function allowOrFailOpen(
  limiter: RateLimiter,
  key: string,
  limit: number,
  windowMs: number,
  onFailure: (error: unknown) => void,
): Promise<RateLimitDecision> {
  try {
    return await limiter.hit(key, limit, windowMs);
  } catch (error) {
    onFailure(error);
    return { limited: false, retryAfterSeconds: 0 };
  }
}
