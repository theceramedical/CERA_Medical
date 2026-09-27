import { NotFoundPage } from '@payloadcms/next/views';

import config from '@payload-config';

import { importMap } from '../importMap.js';

interface Args {
  readonly params: Promise<{ segments: string[] }>;
  readonly searchParams: Promise<Record<string, string | string[]>>;
}

export default function NotFound({ params, searchParams }: Args) {
  return NotFoundPage({ config, params, searchParams, importMap });
}
