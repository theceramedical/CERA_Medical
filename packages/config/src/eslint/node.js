import globals from 'globals';
import tseslint from 'typescript-eslint';

import { baseConfig } from './index.js';

/**
 * Node service config for apps/api, apps/worker, apps/commerce, and packages.
 *
 * The restricted-import list is a data-protection control, not style: it keeps
 * the observability package the only route to a logger, so the allow-list
 * redaction in PRD 10 cannot be sidestepped.
 */
export const nodeConfig = tseslint.config(
  ...baseConfig,

  {
    files: ['**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'pino',
              message:
                'Import the configured logger from @cera/observability so redaction and request-id propagation are applied.',
            },
            {
              name: 'crypto',
              importNames: ['createHash'],
              message:
                'Use the hashing helpers in @cera/contracts so token and email hashing stays consistent.',
            },
          ],
        },
      ],

      // process.exit skips graceful shutdown, which drops in-flight requests
      // and can strand claimed outbox rows.
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'exit',
          message:
            'Use the graceful shutdown handler so in-flight work drains and claimed outbox rows are released.',
        },
      ],
    },
  },

  {
    files: ['**/scripts/**', '**/bin/**', '**/*.config.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
);

export default nodeConfig;
