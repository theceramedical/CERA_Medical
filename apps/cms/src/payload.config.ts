import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { AuditEvents } from './collections/AuditEvents.ts';
import { Categories } from './collections/Categories.ts';
import { Media } from './collections/Media.ts';
import { Pages } from './collections/Pages.ts';
import { Policies } from './collections/Policies.ts';
import { Posts } from './collections/Posts.ts';
import { Redirects } from './collections/Redirects.ts';
import { ServicePresentations } from './collections/ServicePresentations.ts';
import { Users } from './collections/Users.ts';
import { Announcement } from './globals/Announcement.ts';
import { Navigation } from './globals/Navigation.ts';
import { SiteSettings } from './globals/SiteSettings.ts';
import { bootstrapClientContent } from './lib/bootstrap-content.ts';
import { constrainedEditor } from './lib/editor.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * `push` and `migrate` are mutually exclusive.
 *
 * `push: true` lets a local schema change appear without writing a migration.
 * Combining it with `payload migrate` is how two sources of truth fight over
 * the same tables. Push is on only when PAYLOAD_PUSH=1, which the `dev` script
 * does not set and a human can. CI and deploy run `pnpm --filter cms migrate`
 * with push off.
 */
const push = process.env.PAYLOAD_PUSH === '1';

function payloadSecret(): string {
  const value = process.env.PAYLOAD_SECRET;
  if (value !== undefined && value.length >= 16) return value;
  if (process.env.NEXT_PHASE !== undefined || process.env.VITEST === 'true') {
    return 'ci-build-placeholder-not-a-production-secret';
  }
  throw new Error('PAYLOAD_SECRET is required and must be at least 16 characters.');
}

function databaseUrl(): string {
  return (
    process.env.CMS_DATABASE_URL ??
    (process.env.NEXT_PHASE !== undefined || process.env.VITEST === 'true'
      ? 'postgres://cera_cms:unused@127.0.0.1:5432/cera_cms'
      : (() => {
          throw new Error('CMS_DATABASE_URL is required.');
        })())
  );
}

const s3Enabled = process.env.STORAGE_DRIVER === 's3';

export default buildConfig({
  secret: payloadSecret(),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3001',
  cors: [process.env.WEB_URL ?? 'http://localhost:3000'].filter(Boolean),
  csrf: [
    process.env.WEB_URL ?? 'http://localhost:3000',
    process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3001',
  ],
  sharp,
  editor: constrainedEditor(),
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: '· CERA CMS',
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1280, height: 800 },
      ],
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    Posts,
    Categories,
    Policies,
    ServicePresentations,
    Redirects,
    AuditEvents,
  ],
  globals: [Navigation, SiteSettings, Announcement],
  endpoints: [
    {
      path: '/bootstrap-client-content',
      method: 'post',
      handler: async (req) => {
        const given = req.headers.get('x-preview-secret');
        if (given === null || given !== process.env.PAYLOAD_PREVIEW_SECRET) {
          return Response.json({ error: 'unauthenticated' }, { status: 401 });
        }
        await bootstrapClientContent(req.payload);
        return Response.json({ ok: true });
      },
    },
    {
      /**
       * Draft fetch for `apps/web` while Next draftMode is on.
       *
       * Public REST is constraint-filtered to published rows and cannot be asked
       * for a draft. The web app sends the shared preview secret; this process
       * looks the document up with the local API and returns it. The secret
       * never reaches the browser - only the server-side preview route holds it.
       */
      path: '/preview-document',
      method: 'get',
      handler: async (req) => {
        const given = req.headers.get('x-preview-secret');
        if (given === null || given !== process.env.PAYLOAD_PREVIEW_SECRET) {
          return Response.json({ error: 'unauthenticated' }, { status: 401 });
        }

        const url = new URL(req.url ?? 'http://localhost/', 'http://localhost');
        const collection = url.searchParams.get('collection');
        const slug = url.searchParams.get('slug');
        const allowed = ['pages', 'posts', 'policies', 'service-presentations'] as const;
        const allowedCollection = allowed.find((candidate) => candidate === collection);
        if (collection === null || slug === null || allowedCollection === undefined) {
          return Response.json({ error: 'bad_request' }, { status: 400 });
        }

        const result = await req.payload.find({
          collection: allowedCollection,
          where: { slug: { equals: slug } },
          limit: 1,
          draft: true,
          overrideAccess: true,
        });
        const doc = result.docs[0];
        if (doc === undefined) return Response.json({ error: 'not_found' }, { status: 404 });
        return Response.json(doc);
      },
    },
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: databaseUrl() },
    push,
    migrationDir: path.resolve(dirname, '../migrations'),
  }),
  plugins: s3Enabled
    ? [
        s3Storage({
          collections: {
            media: {
              // Public editorial media. Access control lives on the document that
              // references the file, not on the bytes - a published article with
              // a signed URL that expires is a broken image. Credentials stay in
              // this process; generateFileURL returns the public origin only.
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename }) => {
                const origin = (
                  process.env.S3_PUBLIC_URL ?? 'http://localhost:9001/cera-media'
                ).replace(/\/$/, '');
                return `${origin}/${filename ?? ''}`;
              },
            },
          },
          bucket: process.env.S3_BUCKET ?? 'cera-media',
          config: {
            ...(process.env.S3_ENDPOINT === undefined ? {} : { endpoint: process.env.S3_ENDPOINT }),
            region: process.env.S3_REGION ?? 'auto',
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
            },
          },
        }),
      ]
    : [],
});
