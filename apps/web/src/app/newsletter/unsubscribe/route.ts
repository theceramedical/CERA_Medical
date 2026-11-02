import { unsubscribeNewsletter } from '../../../lib/cloudflare/newsletter.ts';

export function GET(request: Request): Promise<Response> {
  return unsubscribeNewsletter(request);
}

export function POST(request: Request): Promise<Response> {
  return unsubscribeNewsletter(request);
}
