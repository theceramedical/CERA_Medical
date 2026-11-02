import { proxyCartRequest } from '../../../../../lib/cart-proxy.ts';
import { handleCloudflareCart } from '../../../../../lib/cloudflare/commerce.ts';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lineId: string }> },
): Promise<Response> {
  const { lineId } = await context.params;
  return (
    (await handleCloudflareCart(request, lineId)) ??
    proxyCartRequest(request, `/v1/cart/lines/${encodeURIComponent(lineId)}`)
  );
}
