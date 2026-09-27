import { generatePageMetadata, RootPage } from '@payloadcms/next/views';

import config from '@payload-config';

import { importMap } from '../importMap.js';

import type { Metadata } from 'next';

interface Args {
  readonly params: Promise<{ segments: string[] }>;
  readonly searchParams: Promise<Record<string, string | string[]>>;
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

export default function Page({ params, searchParams }: Args) {
  return RootPage({ config, params, searchParams, importMap });
}
