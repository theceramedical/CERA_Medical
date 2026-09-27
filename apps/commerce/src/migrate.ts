import { runMigrations } from '@vendure/core';

import { getConfig } from './vendure-config.ts';

await runMigrations(getConfig());
