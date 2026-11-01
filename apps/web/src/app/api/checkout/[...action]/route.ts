import {
  handleCloudflareCheckout,
  handleCloudflareCheckoutConfirmation,
} from '../../../../lib/cloudflare/commerce.ts';

/** Guest checkout requires the D1-backed Cloudflare runtime; do not fall back to account auth. */
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string[] }> },
): Promise<Response> {
  const { action } = await context.params;
  const operation = action.join('/');
  if (operation === 'safepay/start') {
    return Response.json({ error: 'checkout_method_unavailable' }, { status: 410 });
  }
  if (operation !== 'complete') {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const cloudflareResponse = await handleCloudflareCheckout(request);
  if (cloudflareResponse !== null) return cloudflareResponse;

  return Response.json({ error: 'guest_checkout_requires_cloudflare_d1' }, { status: 503 });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ action: string[] }> },
): Promise<Response> {
  const { action } = await context.params;
  if (action.join('/') !== 'confirmation') {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const cloudflareResponse = await handleCloudflareCheckoutConfirmation(request);
  if (cloudflareResponse !== null) return cloudflareResponse;

  return Response.json({ error: 'guest_checkout_requires_cloudflare_d1' }, { status: 503 });
}
