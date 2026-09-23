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
const FLAG = 'CERA_ENABLE_DEV_ROUTES';

afterEach(() => {
  setNodeEnv(ORIGINAL ?? 'test');
  delete process.env[FLAG];
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
   * A guard written as `if (NODE_ENV !== 'development')` would also 404 under `test`, which would make
   * every Vitest and Playwright run fail with a 404 that looks like a routing bug. The condition is
   * deliberately a production block rather than a development allow-list.
   */
  it('allows any environment that is not production', async () => {
    for (const env of ['test', 'staging', '']) {
      setNodeEnv(env);
      const { assertDevOnly } = await import('./guard.ts');

      assertDevOnly();
    }

    expect(notFound).not.toHaveBeenCalled();
  });

  describe(`the ${FLAG} escape hatch`, () => {
    /**
     * The accessibility gate needs the route in a production build, because `next start` forces
     * `NODE_ENV=production` and WP-03.8 deliberately avoids `next dev` - the dev server adds an error
     * overlay and a dev-tools indicator, which are focusable DOM that no user ever loads.
     */
    it('allows production when the flag is exactly "1"', async () => {
      setNodeEnv('production');
      process.env[FLAG] = '1';
      const { assertDevOnly } = await import('./guard.ts');

      assertDevOnly();

      expect(notFound).not.toHaveBeenCalled();
    });

    /**
     * The whole point of an opt-in rather than an opt-out: anything other than a deliberate `1` blocks.
     *
     * `'false'` and `'0'` are the two that matter. Both are truthy strings, so a guard written as
     * `if (process.env[FLAG])` would treat `CERA_ENABLE_DEV_ROUTES=false` as permission - which is the
     * opposite of what whoever typed it meant.
     */
    it.each(['', '0', 'false', 'true', 'yes', ' 1'])(
      'still 404s in production for %j',
      async (value) => {
        setNodeEnv('production');
        process.env[FLAG] = value;
        const { assertDevOnly } = await import('./guard.ts');

        assertDevOnly();

        expect(notFound).toHaveBeenCalledTimes(1);
      },
    );
  });
});
