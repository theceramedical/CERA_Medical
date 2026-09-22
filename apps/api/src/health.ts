import type { FastifyPluginCallback } from 'fastify';

/**
 * Liveness and readiness, kept deliberately distinct.
 *
 * GET /health   - liveness. Is the process able to serve? Never touches a
 *                 dependency. An orchestrator restarting a container because
 *                 PostgreSQL blipped would turn a brief database outage into a
 *                 restart storm.
 *
 * GET /health/ready - readiness. Are the dependencies this service needs
 *                 actually usable? A real query, not a socket connect: a pool
 *                 that hands out broken connections passes a TCP check and
 *                 fails every request.
 *
 * Neither endpoint reveals versions, hostnames, or connection strings. PRD 10
 * treats that as information disclosure.
 */

export interface HealthDependencies {
  /** Executes a trivial query. Resolves on success, rejects otherwise. */
  pingDatabase: () => Promise<void>;
  /** Resolves on a successful Valkey round trip. */
  pingQueue: () => Promise<void>;
}

type CheckState = 'ok' | 'degraded';

interface CheckResult {
  name: string;
  state: CheckState;
  durationMs: number;
}

const READINESS_TIMEOUT_MS = 2_000;

/** A hung dependency must not hold the readiness request open. */
async function withTimeout(probe: () => Promise<void>, timeoutMs: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      probe(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function runCheck(name: string, probe: () => Promise<void>): Promise<CheckResult> {
  const startedAt = performance.now();
  try {
    await withTimeout(probe, READINESS_TIMEOUT_MS);
    return { name, state: 'ok', durationMs: Math.round(performance.now() - startedAt) };
  } catch {
    return { name, state: 'degraded', durationMs: Math.round(performance.now() - startedAt) };
  }
}

// A callback plugin rather than an async one: registration awaits nothing, and
// declaring it async would be a promise that never has anything to resolve.
export const healthRoutes = (deps: HealthDependencies): FastifyPluginCallback => {
  return (app, _options, done) => {
    // Not async, and that is the point: liveness must not be able to await
    // anything. A synchronous handler makes the guarantee structural rather
    // than a comment someone can edit past.
    app.get('/health', (_request, reply) => reply.code(200).send({ status: 'ok' }));

    app.get('/health/ready', async (_request, reply) => {
      const checks = await Promise.all([
        runCheck('database', deps.pingDatabase),
        runCheck('queue', deps.pingQueue),
      ]);

      const ready = checks.every((check) => check.state === 'ok');

      // 503 rather than 200-with-a-flag, so a load balancer needs no knowledge
      // of the response body to route correctly.
      return reply.code(ready ? 200 : 503).send({
        status: ready ? 'ready' : 'not_ready',
        checks: checks.map(({ name, state, durationMs }) => ({ name, state, durationMs })),
      });
    });

    done();
  };
};
