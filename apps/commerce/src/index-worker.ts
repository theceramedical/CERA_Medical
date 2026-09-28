import { bootstrapWorker, runMigrations } from '@vendure/core';

import { getConfig } from './vendure-config.js';

/**
 * Catalogue worker. Separate process, same config, persistent queue.
 *
 * Do not call `bootstrap()` here - that would start a second HTTP server and
 * fight the server container for the port.
 */
const config = getConfig();
await runMigrations(config);
await (await bootstrapWorker(config)).startJobQueue();
