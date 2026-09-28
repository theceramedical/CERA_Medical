import Fastify from 'fastify';
import pg from 'pg';

import { outboxDrainer } from './outbox/drainer.ts';
import { emailProvider, crmProvider } from './ports/providers.ts';
import { createShutdownHandler } from './shutdown.ts';

const PORT = Number(process.env.WORKER_PORT ?? process.env.PORT ?? 3004);
const HOST = process.env.HOST ?? '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Spread rather than an explicit undefined: with exactOptionalPropertyTypes the
// two differ, and pino reads a present-but-undefined transport as configured.
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    ...(IS_PRODUCTION ? {} : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
  },
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  connectionTimeoutMillis: 5_000,
});

const email = emailProvider();
const drainer = outboxDrainer(pool, email, crmProvider(), (error) =>
  app.log.error(
    { err: error instanceof Error ? error.message : 'unknown' },
    'outbox delivery failed',
  ),
);
app.get('/health', async (_request, reply) => {
  try {
    return reply.send({
      status: 'ok',
      queue: await drainer.health(),
      drivers: { email: process.env.EMAIL_DRIVER, crm: process.env.CRM_DRIVER },
    });
  } catch {
    return reply.code(503).send({ status: 'not_ready' });
  }
});

app.get('/health/ready', async (_request, reply) => {
  try {
    await pool.query('SELECT 1');
    return reply.code(200).send({ status: 'ready' });
  } catch {
    return reply.code(503).send({ status: 'not_ready' });
  }
});

/**
 * Shutdown stages, in the order they must run. Queue consumers are inserted
 * between 'http' and 'pool' in Phase 10; the ordering guarantees and the
 * reasoning live in `shutdown.ts`, which is unit-tested.
 */
const shutdown = createShutdownHandler({
  stages: [
    { name: 'http', close: () => app.close() },
    { name: 'outbox', close: () => drainer.close() },
    {
      name: 'email',
      close: () => {
        email.close?.();
        return Promise.resolve();
      },
    },
    { name: 'pool', close: () => pool.end() },
  ],
  onEvent: (event) => {
    switch (event.type) {
      case 'started':
        app.log.info({ signal: event.signal }, 'shutdown requested, finishing in-flight jobs');
        break;
      case 'stage_complete':
        app.log.debug({ stage: event.name, durationMs: event.durationMs }, 'stage closed');
        break;
      case 'stage_failed':
        app.log.error({ stage: event.name, err: event.error }, 'stage failed to close');
        break;
      case 'completed':
        app.log.info({ durationMs: event.durationMs }, 'drained, no jobs left in flight');
        break;
      case 'timed_out':
        app.log.error(
          { timeoutMs: event.timeoutMs },
          'shutdown timed out; claimed outbox rows will be retried after the claim timeout',
        );
        break;
      case 'ignored_duplicate':
        app.log.warn({ signal: event.signal }, 'shutdown already in progress, ignoring signal');
        break;
    }
  },
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    void shutdown(signal).then((result) => {
      process.exitCode = result.ok ? 0 : 1;
    });
  });
}

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info({ port: PORT }, 'worker ready; outbox sweep and provider adapters registered');
} catch (error) {
  app.log.error({ err: error }, 'failed to start');
  process.exitCode = 1;
}
