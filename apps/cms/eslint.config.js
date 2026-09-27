import { reactConfig } from '@cera/config/eslint/react';

export default [
  ...reactConfig,
  {
    files: ['src/app/**/route.ts', 'src/payload.config.ts', 'src/seed.ts', '*.config.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
