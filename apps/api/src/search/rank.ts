import { type SearchHit } from '@cera/contracts';

/**
 * Deterministic in-process ranking for search (WEB-303).
 *
 * Title matches weigh more than excerpts. Equal scores sort by slug, then kind,
 * so two identical queries cannot swap order. Draft and inactive documents are
 * the caller's job to exclude before they reach this function.
 *
 * PostgreSQL `tsvector` is the production path once the index table is populated;
 * this is the same ranking contract the SQL must implement, and the one the
 * tests pin.
 */

export interface Searchable {
  readonly kind: SearchHit['kind'];
  readonly type: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string | null;
}

export function rankSearch(query: string, items: readonly Searchable[]): SearchHit[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  const scored = items
    .map((item) => ({ item, score: scoreItem(item, terms) }))
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const slug = a.item.slug.localeCompare(b.item.slug);
    if (slug !== 0) return slug;
    return a.item.kind.localeCompare(b.item.kind);
  });

  return scored.map(({ item }) => ({
    kind: item.kind,
    type: item.type,
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt,
  }));
}

function scoreItem(item: Searchable, terms: readonly string[]): number {
  const title = item.title.toLowerCase();
  const excerpt = (item.excerpt ?? '').toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 3;
    if (excerpt.includes(term)) score += 1;
  }
  return score;
}
