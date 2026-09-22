import { nodeConfig } from '@cera/config/eslint/node';

export default [
  ...nodeConfig,
  {
    // The rule that bans `pino` everywhere else exists so no app can build its own
    // logger and bypass redaction. This file is what the rule points people at, so
    // it is the one place the import is allowed.
    files: ['src/logger.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
