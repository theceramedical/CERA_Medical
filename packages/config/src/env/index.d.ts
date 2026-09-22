import type { z } from 'zod';

export declare const commonEnvSchema: z.ZodTypeAny;
export declare const databaseEnvSchema: z.ZodTypeAny;
export declare const valkeyEnvSchema: z.ZodTypeAny;
export declare const webEnvSchema: z.ZodTypeAny;
export declare const apiEnvSchema: z.ZodTypeAny;
export declare const workerEnvSchema: z.ZodTypeAny;
export declare const cmsEnvSchema: z.ZodTypeAny;
export declare const commerceEnvSchema: z.ZodTypeAny;

/**
 * Validates `source` against `schema`, reporting every failure at once.
 *
 * @throws when validation fails, with one line per invalid variable.
 */
export declare function loadEnv<T>(
  schema: z.ZodType<T>,
  source?: NodeJS.ProcessEnv,
  serviceName?: string,
): T;

/** Every service schema, keyed by service name. */
export declare const envSchemas: Record<string, z.ZodTypeAny>;
