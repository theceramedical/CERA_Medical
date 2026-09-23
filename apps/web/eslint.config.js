import { reactConfig } from '@cera/config/eslint/react';

export default [
  ...reactConfig,
  {
    /**
     * Route handlers, the root layout, and config files run on the server and legitimately
     * touch `process.env`. The React-specific rules have nothing to check in them.
     */
    files: ['src/app/**/route.ts', 'src/instrumentation.ts', '*.config.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
