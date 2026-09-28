import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateMigration } from '@vendure/core';

import { getConfig } from './vendure-config.js';

const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9_-]*$/.test(name)) {
  throw new Error('Usage: pnpm --filter commerce migration:generate <lowercase-name>');
}
const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');
const generated = await generateMigration(getConfig(), { name, outputDir });
if (!generated) process.exitCode = 1;
