import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { healthRoutes } from './health.ts';

/**
 * The behaviour worth protecting here is the split between liveness and
 * readiness. If a future change makes /health touch the database, a database
 * outage becomes a restart loop, and these tests are what catch it.
 */

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

const build = async (overrides: {
  pingDatabase?: () => Promise<void>;
  pingQueue?: () => Promise<void>;
}): Promise<FastifyInstance> => {
  const instance = Fastify({ logger: false });
  await instance.register(
    healthRoutes({
      pingDatabase: overrides.pingDatabase ?? (() => Promise.resolve()),
      pingQueue: overrides.pingQueue ?? (() => Promise.resolve()),
    }),
  );
  await instance.ready();
  return instance;
};

describe('GET /health (liveness)', () => {
  it('returns 200 even when every dependency is down', async () => {
    app = await build({
      pingDatabase: () => Promise.reject(new Error('database is gone')),
      pingQueue: () => Promise.reject(new Error('valkey is gone')),
    });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('does not disclose version or host details', async () => {
    app = await build({});

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(Object.keys(response.json<Record<string, unknown>>())).toEqual(['status']);
  });
});

describe('GET /health/ready (readiness)', () => {
  it('returns 200 when all dependencies respond', async () => {
    app = await build({});

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ status: string }>().status).toBe('ready');
  });

  it('returns 503 when the database is unreachable', async () => {
    app = await build({ pingDatabase: () => Promise.reject(new Error('ECONNREFUSED')) });

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    const body = response.json<{ status: string; checks: { name: string; state: string }[] }>();
    expect(body.status).toBe('not_ready');
    expect(body.checks.find((check) => check.name === 'database')?.state).toBe('degraded');
  });

  it('reports a hung dependency as degraded instead of hanging', async () => {
    app = await build({
      // Never resolves. Without the timeout this request would hang until the
      // client gave up, and the orchestrator would read that as unhealthy for
      // the wrong reason.
      pingQueue: () => new Promise<void>(() => undefined),
    });

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    const body = response.json<{ checks: { name: string; state: string }[] }>();
    expect(body.checks.find((check) => check.name === 'queue')?.state).toBe('degraded');
  }, 10_000);

  it('never leaks the underlying error message', async () => {
    app = await build({
      pingDatabase: () =>
        Promise.reject(new Error('password authentication failed for user "cera_app"')),
    });

    const raw = (await app.inject({ method: 'GET', url: '/health/ready' })).body;

    expect(raw).not.toContain('password');
    expect(raw).not.toContain('cera_app');
  });
});
