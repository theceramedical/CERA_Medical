import { reactConfig } from '@cera/config/eslint/react';

export default [
  // Payload rewrites this generated component registry during every build.
  { ignores: ['src/app/**/admin/importMap.js', 'migrations/**'] },
  ...reactConfig,
  {
    files: ['src/app/**/route.ts', 'src/payload.config.ts', 'src/seed.ts', '*.config.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
