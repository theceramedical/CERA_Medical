import { cloudflare } from '@cloudflare/vite-plugin';
import { kvDataAdapter } from '@vinext/cloudflare/cache/kv-data-adapter';
import vinext from 'vinext';
import { defineConfig } from 'vite';

const dataCacheAdapter = { ...kvDataAdapter(), options: {} };

export default defineConfig({
  plugins: [
    vinext({ cache: { data: dataCacheAdapter } }),
    cloudflare({
      viteEnvironment: {
        name: 'rsc',
        childEnvironments: ['ssr'],
      },
    }),
  ],
});
