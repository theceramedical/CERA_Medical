import { handleCloudflareEnquiry } from '../../../lib/cloudflare/enquiries.ts';

export async function POST(request: Request): Promise<Response> {
  const cloudflareResponse = await handleCloudflareEnquiry(request);
  if (cloudflareResponse !== null) return cloudflareResponse;
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
