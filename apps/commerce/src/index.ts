import { bootstrap, runMigrations } from '@vendure/core';

import { getConfig } from './vendure-config.js';

/**
 * Catalogue server. The worker is a separate process (`index-worker.ts`).
 *
 * An in-memory queue cannot be used when the worker is a separate container:
 * jobs published here would never be seen there. BullMQ on Valkey is the
 * shared queue (WP-06.1).
 */
const config = getConfig();
await runMigrations(config);
await bootstrap(config);
