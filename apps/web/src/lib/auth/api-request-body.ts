/** Fastify 5 rejects `Content-Type: application/json` with an empty body; send `{}` instead. */
export function jsonBodyForApiRequest(method: string, body?: unknown): string | undefined {
  if (body !== undefined) return JSON.stringify(body);
  if (method === 'GET' || method === 'HEAD') return undefined;
  return JSON.stringify({});
}
