import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request): Promise<Response> {
  const draft = await draftMode();
  draft.disable();

  const next = new URL(request.url).searchParams.get('path') ?? '/';
  const path = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  redirect(path);
}
