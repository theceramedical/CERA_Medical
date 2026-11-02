import { confirmNewsletter } from '../../../lib/cloudflare/newsletter.ts';

export function GET(request: Request): Promise<Response> {
  return confirmNewsletter(request);
}

export function POST(request: Request): Promise<Response> {
  return confirmNewsletter(request);
}
