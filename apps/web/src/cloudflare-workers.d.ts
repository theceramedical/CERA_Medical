declare module 'cloudflare:workers' {
  export const env: {
    readonly DB?: import('./lib/cloudflare/runtime.ts').D1Database;
    readonly MEDIA?: unknown;
  };
}
