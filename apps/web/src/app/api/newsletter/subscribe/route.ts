import { subscribeToNewsletter } from '../../../../lib/cloudflare/newsletter.ts';

export async function POST(request: Request): Promise<Response> {
  const response = await subscribeToNewsletter(request);
  return response ?? Response.json({ error: 'newsletter_unavailable' }, { status: 503 });
}
