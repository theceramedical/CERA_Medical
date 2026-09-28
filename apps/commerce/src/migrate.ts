import { runMigrations } from '@vendure/core';

import { getConfig } from './vendure-config.js';

await runMigrations(getConfig());
