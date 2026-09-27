import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify from 'fastify';
import pg from 'pg';

import { createSessionReader } from './auth/read-session.ts';
import { memoryCatalogueCache } from './catalogue/cache.ts';
import { catalogueRoutes } from './catalogue/routes.ts';
import { createVendureClient } from './catalogue/vendure-client.ts';
import { enquiryRoutes } from './enquiry/routes.ts';
import { healthRoutes } from './health.ts';
import { opsRoutes } from './ops/routes.ts';
import { portalRoutes } from './portal/routes.ts';
import { memoryPortalStore } from './portal/store.ts';
import { searchRoutes } from './search/routes.ts';
import { resendWebhookRoutes } from './webhooks/resend.ts';

/**
 * Authorisation boundary (ADR-003). Catalogue reads arrive in Phase 06;
 * enquiry and identity routes arrive from Phase 08. What exists here is the
 * shape everything else hangs off: validated configuration, a real connection
 * pool, health endpoints, and graceful shutdown.
 *
 * Graceful shutdown is not boilerplate for this service. From Phase 10 the
 * worker claims outbox rows, and a hard exit strands them as claimed-but-never-
 * processed until the reaper interval passes. Draining properly is the
 * difference between a clean deploy and a delayed enquiry.
 */

const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 3003);
const HOST = process.env.HOST ?? '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// `transport` is spread in rather than set to undefined. With
// exactOptionalPropertyTypes the two are not equivalent: an explicit undefined
// is a type error, and pino would treat it as a configured-but-empty transport.
const loggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'res.headers["set-cookie"]',
    ],
    remove: true,
  },
  ...(IS_PRODUCTION ? {} : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
};

const app = Fastify({
  // Trusting the proxy is what makes request IPs correct behind Caddy, and the
  // rate limiter in Phase 08 depends on that being right.
  trustProxy: true,
  disableRequestLogging: false,
  logger: loggerOptions,
  // Reject oversized bodies before parsing. The largest legitimate payload is
  // an enquiry, which is well under 100 kB.
  bodyLimit: 128 * 1024,
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  // Fail fast rather than queue indefinitely when the database is unreachable.
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
});

await app.register(helmet, {
  // The API serves JSON only, so a restrictive CSP costs nothing here.
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'same-site' },
});

// An explicit allow-list. A reflected origin plus credentials is the classic
// way a same-site cookie becomes cross-site readable.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

await app.register(cors, {
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  maxAge: 600,
});

const catalogueClient = createVendureClient(
  process.env.VENDURE_SHOP_API_URL ?? 'http://localhost:3002/shop-api',
);

await app.register(
  catalogueRoutes({
    client: catalogueClient,
    cache: memoryCatalogueCache(),
  }),
);

await app.register(searchRoutes({ catalogue: catalogueClient }));
await app.register(enquiryRoutes());

const portalStore = memoryPortalStore();
const readSession = createSessionReader(process.env.SESSION_SECRET ?? 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
await app.register(portalRoutes({ store: portalStore, readSession }));
await app.register(opsRoutes({ store: portalStore, readSession }));
await app.register(resendWebhookRoutes(process.env.RESEND_WEBHOOK_SECRET ?? 'whsec_local'));

await app.register(
  healthRoutes({
    pingDatabase: async () => {
      await pool.query('SELECT 1');
    },
    // Replaced with a real Valkey ping in Phase 10, when the outbox lands.
    pingQueue: async () => Promise.resolve(),
  }),
);

/**
 * Drain in the right order: stop accepting connections, finish in-flight
 * requests, then release the pool. Closing the pool first would fail the
 * requests that are still running.
 */
let shuttingDown = false;
const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;

  app.log.info({ signal }, 'shutdown requested, draining');
  try {
    await app.close();
    await pool.end();
    app.log.info('drained cleanly');
    process.exitCode = 0;
  } catch (error) {
    app.log.error({ err: error }, 'shutdown failed');
    process.exitCode = 1;
  }
};

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

try {
  await app.listen({ port: PORT, host: HOST });
} catch (error) {
  app.log.error({ err: error }, 'failed to start');
  process.exitCode = 1;
}
