import { handleCloudflareStaffOrders } from '../../../../lib/cloudflare/staff-orders.ts';

export async function GET(request: Request): Promise<Response> {
  const response = await handleCloudflareStaffOrders(request);
  if (response) return response;
  return Response.json({ error: 'service_unavailable' }, { status: 503 });
}
