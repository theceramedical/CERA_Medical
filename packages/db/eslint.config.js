import { nodeConfig } from '@cera/config/eslint/node';

export default [
  ...nodeConfig,
  {
    // The migration runner and the seeder are CLIs. Their output is the user
    // interface, so they print to the console rather than emitting structured logs
    // to a collector that is not running at deploy time.
    files: ['src/migrate.ts', 'src/seed.ts'],
    rules: { 'no-console': 'off' },
  },
];
