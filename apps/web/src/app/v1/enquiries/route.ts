import { handleCloudflareEnquiry } from '../../../lib/cloudflare/enquiries.ts';
import { isCloudflareWorkerRuntime } from '../../../lib/cloudflare/runtime.ts';

export async function POST(request: Request): Promise<Response> {
  const cloudflareResponse = await handleCloudflareEnquiry(request);
  if (cloudflareResponse !== null) return cloudflareResponse;
  // In the Worker, a missing D1 binding must never route an accepted enquiry into a
  // separate API database that staff cannot see. Local Next.js development may use the API.
  if (await isCloudflareWorkerRuntime()) {
    return Response.json(
      { error: { message: 'service_unavailable', retryable: true } },
      { status: 503 },
    );
  }
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin) {
    return Response.json({ error: { message: 'forbidden' } }, { status: 403 });
  }

  const api = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!api)
    return Response.json(
      { error: { message: 'service_unavailable', retryable: true } },
      { status: 503 },
    );
  const idempotencyKey = request.headers.get('idempotency-key');

  try {
    const upstream = await fetch(`${api.replace(/\/$/, '')}/v1/enquiries`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
      },
      body: await request.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return Response.json(
      { error: { message: 'service_unavailable', retryable: true } },
      { status: 503 },
    );
  }
}
