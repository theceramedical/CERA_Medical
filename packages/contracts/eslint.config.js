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
  {
    // The fixtures need a stable hash to derive identifiers from names, which is
    // not the email-and-token hashing path the restriction protects: these values
    // are never compared against anything a customer supplies. Claim token and
    // email hashes in the fixtures still go through `primitives.ts`, so the one
    // derivation that must not diverge does not.
    files: ['src/fixtures/deterministic.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
