import { getSession } from '../../../../lib/auth/session.ts';
import { rolesIncludeStaff } from '../../../../lib/auth/staff-roles.ts';
import { handleCloudflareOpsApi } from '../../../../lib/cloudflare/ops-api.ts';

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session || !rolesIncludeStaff(session.roles))
    return Response.json({ error: 'forbidden' }, { status: 403 });
  try {
    const result = await handleCloudflareOpsApi('/v1/ops/enquiries', 'GET', undefined, session);
    return result === null
      ? Response.json({ error: 'service_unavailable' }, { status: 503 })
      : Response.json(result, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return Response.json({ error: 'service_unavailable' }, { status: 503 });
  }
}
