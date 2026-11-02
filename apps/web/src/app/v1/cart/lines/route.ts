import { proxyCartRequest } from '../../../../lib/cart-proxy.ts';
import { handleCloudflareCart } from '../../../../lib/cloudflare/commerce.ts';

export async function POST(request: Request): Promise<Response> {
  return (await handleCloudflareCart(request)) ?? proxyCartRequest(request, '/v1/cart/lines');
}
