import { getSession } from '../../../../../lib/auth/session.ts';
import { rolesIncludeStaff } from '../../../../../lib/auth/staff-roles.ts';
import { CloudflareApiError } from '../../../../../lib/cloudflare/api-error.ts';
import { handleCloudflareOpsApi } from '../../../../../lib/cloudflare/ops-api.ts';
import { getCloudflareDatabase } from '../../../../../lib/cloudflare/runtime.ts';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return dispatch(request, context, 'GET');
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return dispatch(request, context, 'PATCH');
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return dispatch(request, context, 'POST');
}

async function dispatch(
  request: Request,
  context: RouteContext,
  method: 'GET' | 'PATCH' | 'POST',
): Promise<Response> {
  const { path } = await context.params;
  if (!isSupportedPath(path, method)) return json({ error: 'not_found' }, 404);

  const session = await getSession();
  if (!session || !rolesIncludeStaff(session.roles)) return json({ error: 'forbidden' }, 403);
  if (!(await getCloudflareDatabase())) return json({ error: 'service_unavailable' }, 503);

  let body: unknown;
  if (method !== 'GET') {
    try {
      body = await request.json();
    } catch {
      return json({ error: 'validation_failed' }, 400);
    }
  }

  try {
    const result = await handleCloudflareOpsApi(
      `/v1/ops/enquiries/${path.map(encodeURIComponent).join('/')}`,
      method,
      body,
      session,
    );
    return result === null ? json({ error: 'not_found' }, 404) : json(result);
  } catch (error) {
    return error instanceof CloudflareApiError
      ? json({ error: error.message.toLowerCase().replaceAll(' ', '_') }, error.status)
      : json({ error: 'service_unavailable' }, 503);
  }
}

function isSupportedPath(path: readonly string[], method: string): boolean {
  if (path.length === 1) return method === 'GET';
  if (path.length !== 2) return false;
  const action = path[1];
  return (
    (action === 'assign' && method === 'PATCH') ||
    (action === 'transition' && method === 'POST') ||
    (action === 'notes' && (method === 'GET' || method === 'POST')) ||
    (action === 'audit' && method === 'GET')
  );
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}
