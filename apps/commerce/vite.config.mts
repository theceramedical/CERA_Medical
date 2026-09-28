import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { vendureDashboardPlugin } from '@vendure/dashboard/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dashboard/',
  build: { outDir: resolve('dist/dashboard'), emptyOutDir: true },
  plugins: [vendureDashboardPlugin({
    vendureConfigPath: pathToFileURL(resolve('src/dashboard-config.ts')),
    vendureConfigExport: 'config',
    module: 'esm',
    api: { host: 'auto', port: 'auto' },
    gqlOutputPath: './src/gql',
  })],
});
