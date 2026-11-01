export interface D1Result<Row = Record<string, unknown>> {
  readonly results?: Row[];
  readonly success?: boolean;
  readonly meta?: { readonly changes?: number };
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<Row = Record<string, unknown>>(columnName?: string): Promise<Row | null>;
  all<Row = Record<string, unknown>>(): Promise<D1Result<Row>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1Statement;
  batch<T extends D1Statement[]>(statements: T): Promise<{ [K in keyof T]: D1Result }>;
}

interface CloudflareRuntimeModule {
  readonly env?: { readonly DB?: D1Database };
}

/** Returns the bound D1 database in Workers; local Next development keeps using the API service. */
export async function getCloudflareDatabase(): Promise<D1Database | null> {
  try {
    const runtime = (await import('cloudflare:workers')) as CloudflareRuntimeModule;
    return runtime.env?.DB ?? null;
  } catch {
    return null;
  }
}

/** Distinguishes local Next.js, which has no Cloudflare module, from a Worker missing its D1 binding. */
export async function isCloudflareWorkerRuntime(): Promise<boolean> {
  try {
    await import('cloudflare:workers');
    return true;
  } catch {
    return false;
  }
}
