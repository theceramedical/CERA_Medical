import { nodeConfig } from '@cera/config/eslint/node';

export default [
  ...nodeConfig,
  {
    // The migration runner is a CLI. Its output is the user interface, so it
    // prints to the console rather than emitting structured logs to a collector
    // that is not running at deploy time.
    files: ['src/migrate.ts'],
    rules: { 'no-console': 'off' },
  },
];
