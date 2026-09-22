import type { ViteUserConfig } from 'vitest/config';

/**
 * Shared Vitest base configuration. Merge with `mergeConfig` rather than
 * spreading, so nested `test.coverage` options combine instead of replacing.
 */
export declare const baseTestConfig: ViteUserConfig;
export default baseTestConfig;
