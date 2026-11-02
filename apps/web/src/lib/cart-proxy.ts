export async function proxyCartRequest(request: Request, path: string): Promise<Response> {
  if (request.method !== 'GET' && request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const api = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!api) return Response.json({ error: 'cart_unavailable' }, { status: 503 });
  const cookieHeader = request.headers.get('cookie');

  try {
    const upstream = await fetch(`${api.replace(/\/$/, '')}${path}`, {
      method: request.method,
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(request.method === 'GET' ? {} : { 'content-type': 'application/json' }),
      },
      ...(request.method === 'GET' ? {} : { body: await request.text() }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const response = new Response(upstream.body, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append('set-cookie', cookie);
    return response;
  } catch {
    return Response.json({ error: 'cart_unavailable' }, { status: 503 });
  }
}
