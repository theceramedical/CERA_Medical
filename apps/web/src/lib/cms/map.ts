import { ContentDocumentSchema, type ContentDocument, type ContentType } from '@cera/contracts';

import { publicizeCmsMediaUrl } from './media-url.ts';

/**
 * Maps a Payload REST document onto `ContentDocumentSchema`.
 *
 * The web app never reads Payload's shape directly. A CMS field rename then
 * fails this parse - a caught error - instead of rendering a page with a
 * silently missing section.
 */

interface PayloadMedia {
  readonly id?: string | number;
  readonly url?: string | null;
  readonly alt?: string | null;
  readonly sizes?: Readonly<Record<string, { readonly url?: string | null }>>;
}

interface PayloadDocument {
  readonly id: string | number;
  readonly slug?: string | null;
  readonly title?: string | null;
  readonly excerpt?: string | null;
  readonly galleryHeading?: string | null;
  readonly gallery?: readonly (number | string | PayloadMedia)[] | null;
  readonly teamHeading?: string | null;
  readonly teamIntroduction?: string | null;
  readonly teamMembers?:
    | readonly {
        id?: string;
        name: string;
        role: string;
        biography?: string | null;
        photo?: number | string | PayloadMedia | null;
        links?: readonly { label: string; url: string }[] | null;
      }[]
    | null;
  readonly body?: unknown;
  readonly layout?: unknown;
  readonly seo?: {
    readonly title?: string | null;
    readonly description?: string | null;
    readonly canonicalUrl?: string | null;
    readonly ogImage?: string | PayloadMedia | null;
    readonly noIndex?: boolean | null;
  } | null;
  readonly cover?: string | PayloadMedia | null;
  readonly _status?: 'draft' | 'published' | null;
  readonly cardHighlights?: readonly { readonly text?: string | null }[] | null;
  readonly cardIcon?: string | null;
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

function mediaPickUrl(
  value: string | PayloadMedia | null | undefined,
  size: 'card' | 'og' | 'hero',
): string | null {
  if (value === null || value === undefined || typeof value === 'string') return null;
  const sized = value.sizes?.[size]?.url;
  if (typeof sized === 'string' && sized.length > 0) {
    return publicizeCmsMediaUrl(sized);
  }
  const url = value.url;
  return typeof url === 'string' && url.length > 0 ? publicizeCmsMediaUrl(url) : null;
}

function mediaAlt(value: string | PayloadMedia | null | undefined): string | null {
  if (value === null || value === undefined || typeof value === 'string') return null;
  const alt = value.alt;
  return typeof alt === 'string' && alt.length > 0 ? alt : null;
}

function iso(value: string | Date | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.length > 0) return value;
  return new Date(0).toISOString();
}

function cardHighlightsFromDoc(doc: PayloadDocument): readonly string[] | undefined {
  const raw = doc.cardHighlights;
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .map((row) => {
      if (row === null || typeof row !== 'object') return null;
      const text = (row as { text?: unknown }).text;
      return typeof text === 'string' ? text : null;
    })
    .filter((text): text is string => typeof text === 'string' && text.length > 0);
  return items.length > 0 ? items : undefined;
}

function galleryImage(value: number | string | PayloadMedia | null | undefined) {
  if (!value || typeof value !== 'object' || !value.url) return null;
  try {
    const url = new URL(value.url, process.env.CMS_URL ?? 'http://localhost:3001');
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return { url: publicizeCmsMediaUrl(url.href) ?? url.href, alt: value.alt ?? '' };
  } catch {
    return null;
  }
}

function safeProfileUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function mapCmsDocument(type: ContentType, doc: PayloadDocument): ContentDocument {
  const coverId = relationId(doc.cover);
  const ogImageId = relationId(doc.seo?.ogImage ?? null);
  const mediaIds = [coverId, ogImageId].filter((id): id is string => id !== null);
  const coverImageUrl = mediaPickUrl(doc.cover, 'card');
  const coverImageAlt = mediaAlt(doc.cover);
  const ogImageUrl = mediaPickUrl(doc.seo?.ogImage ?? null, 'og');
  const cardHighlights = cardHighlightsFromDoc(doc);
  const cardIcon =
    typeof doc.cardIcon === 'string' && doc.cardIcon.length > 0 ? doc.cardIcon : undefined;

  return ContentDocumentSchema.parse({
    id: String(doc.id),
    type,
    slug: doc.slug ?? '',
    title: doc.title ?? '',
    excerpt: doc.excerpt ?? null,
    body: doc.body ?? null,
    layout: doc.layout,
    galleryHeading: doc.galleryHeading ?? undefined,
    gallery: (doc.gallery ?? []).map(galleryImage).filter((image) => image !== null),
    teamHeading: doc.teamHeading ?? undefined,
    teamIntroduction: doc.teamIntroduction ?? undefined,
    teamMembers: (doc.teamMembers ?? []).map((member) => ({
      id: member.id ?? `${member.name}-${member.role}`,
      name: member.name,
      role: member.role,
      biography: member.biography ?? undefined,
      photo: galleryImage(member.photo) ?? undefined,
      links: (member.links ?? []).filter((link) => safeProfileUrl(link.url)),
    })),
    ...(cardHighlights !== undefined ? { cardHighlights } : {}),
    ...(cardIcon !== undefined ? { cardIcon } : {}),
    seo: {
      title: doc.seo?.title ?? null,
      description: doc.seo?.description ?? null,
      canonicalUrl: doc.seo?.canonicalUrl ?? null,
      ogImageId,
      ...(ogImageUrl !== null ? { ogImageUrl } : {}),
      noIndex: doc.seo?.noIndex ?? false,
    },
    ...(coverImageUrl !== null ? { coverImageUrl } : {}),
    ...(coverImageAlt !== null ? { coverImageAlt } : {}),
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
