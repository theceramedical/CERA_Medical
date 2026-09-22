import { nodeConfig } from '@cera/config/eslint/node';

export default [
  ...nodeConfig,
  {
    // primitives.ts is the one place `createHash` may be imported. The
    // restriction exists so email and token hashing cannot diverge between the
    // API and the worker, which would make claiming fail for a subset of
    // addresses and look like flakiness rather than a bug.
    files: ['src/primitives.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
