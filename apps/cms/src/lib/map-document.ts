import { ContentDocumentSchema, type ContentDocument, type ContentType } from '@cera/contracts';

/**
 * Maps a Payload document onto `ContentDocumentSchema`.
 *
 * The web app never reads Payload's shape directly. A CMS field rename then
 * fails this parse - a caught error - instead of rendering a page with a
 * silently missing section. `body` stays `unknown`: Lexical's AST is Payload's
 * to validate.
 */

export interface PayloadDocument {
  readonly id: string | number;
  readonly slug?: string | null;
  readonly title?: string | null;
  readonly excerpt?: string | null;
  readonly body?: unknown;
  readonly seo?: {
    readonly title?: string | null;
    readonly description?: string | null;
    readonly canonicalUrl?: string | null;
    readonly ogImage?: string | { readonly id?: string | number } | null;
    readonly noIndex?: boolean | null;
  } | null;
  readonly cover?: string | { readonly id?: string | number } | null;
  readonly _status?: 'draft' | 'published' | null;
  readonly authorId?: string | null;
  readonly approverId?: string | null;
  readonly publishedAt?: string | Date | null;
  readonly createdAt?: string | Date;
  readonly updatedAt?: string | Date;
}

function relationId(
  value: string | { readonly id?: string | number } | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (value.id === undefined) return null;
  return String(value.id);
}

function iso(value: string | Date | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.length > 0) return value;
  return new Date(0).toISOString();
}

export function mapDocument(type: ContentType, doc: PayloadDocument): ContentDocument {
  const mediaIds = [relationId(doc.cover)].filter((id): id is string => id !== null);

  return ContentDocumentSchema.parse({
    id: String(doc.id),
    type,
    slug: doc.slug ?? '',
    title: doc.title ?? '',
    excerpt: doc.excerpt ?? null,
    body: doc.body ?? null,
    seo: {
      title: doc.seo?.title ?? null,
      description: doc.seo?.description ?? null,
      canonicalUrl: doc.seo?.canonicalUrl ?? null,
      ogImageId: relationId(doc.seo?.ogImage ?? null),
      noIndex: doc.seo?.noIndex ?? false,
    },
    mediaIds,
    status: doc._status === 'published' ? 'published' : 'draft',
    authorId: doc.authorId ?? null,
    approverId: doc.approverId ?? null,
    publishedAt:
      doc.publishedAt === null || doc.publishedAt === undefined ? null : iso(doc.publishedAt),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  });
}
