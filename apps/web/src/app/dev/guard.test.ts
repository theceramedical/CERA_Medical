import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `notFound` is mocked rather than imported for real.
 *
 * The real one throws a framework-internal control-flow error that only means anything inside a
 * render. What is being tested here is narrower and more important: whether the guard calls it, and
 * under which value of `NODE_ENV`. A spy answers that exactly.
 */
const notFound = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({ notFound }));

/**
 * `NODE_ENV` is read at call time, not at module load, so the import can be hoisted normally and
 * each case only has to set the variable.
 *
 * Assigned through a cast because `@types/node` types `NODE_ENV` as a read-only union. The cast is
 * confined to the test; nothing in `src` writes to it.
 */
function setNodeEnv(value: string): void {
  (process.env as { NODE_ENV: string }).NODE_ENV = value;
}

const ORIGINAL = process.env.NODE_ENV;

afterEach(() => {
  setNodeEnv(ORIGINAL ?? 'test');
  notFound.mockClear();
});

describe('assertDevOnly', () => {
  it('404s in production', async () => {
    setNodeEnv('production');
    const { assertDevOnly } = await import('./guard.ts');

    assertDevOnly();

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it('allows development', async () => {
    setNodeEnv('development');
    const { assertDevOnly } = await import('./guard.ts');

    assertDevOnly();

    expect(notFound).not.toHaveBeenCalled();
  });

  /**
   * The default case, and the one worth asserting explicitly.
   *
   * A guard written as `if (NODE_ENV !== 'development')` would also 404 under `test`, which would
   * make every Playwright run against a built app fail with a 404 that looks like a routing bug. The
   * condition is deliberately a production allow-block rather than a development allow-list.
   */
  it('allows any environment that is not production', async () => {
    for (const env of ['test', 'staging', '']) {
      setNodeEnv(env);
      const { assertDevOnly } = await import('./guard.ts');

      assertDevOnly();
    }

    expect(notFound).not.toHaveBeenCalled();
  });
});
