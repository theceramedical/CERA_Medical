#!/usr/bin/env node
/**
 * Copies `theme.css` into the standalone bundle path that `@cera/ui/tokens` resolves at runtime.
 *
 * Next traces server code into `.next/standalone` but does not place workspace package assets next
 * to bundled modules. `manifest.ts` and `/dev/design` read the stylesheet from disk, so Playwright
 * and production containers need this file where `import.meta.url` points after the trace.
 */

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(webRoot, '../../packages/ui/src/styles/theme.css');
const destination = join(webRoot, '.next/standalone/packages/ui/src/styles/theme.css');

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
