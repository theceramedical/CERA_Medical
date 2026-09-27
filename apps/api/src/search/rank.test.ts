import { describe, expect, it } from 'vitest';

import { rankSearch, type Searchable } from './rank.ts';

const items: readonly Searchable[] = [
  { kind: 'service', type: 'service', slug: 'cardiology', title: 'Cardiology', excerpt: 'Heart care' },
  { kind: 'service', type: 'service', slug: 'orthopaedics', title: 'Orthopaedics', excerpt: 'Moving' },
  { kind: 'content', type: 'post', slug: 'heart-habits', title: 'Heart habits', excerpt: 'Cardiology tips' },
];

describe('rankSearch', () => {
  it('is deterministic across identical queries', () => {
    const first = rankSearch('cardiology', items);
    const second = rankSearch('cardiology', items);
    expect(first).toEqual(second);
    expect(first.map((hit) => hit.slug)).toEqual(['cardiology', 'heart-habits']);
  });

  it('uses slug as the tiebreaker when scores match', () => {
    const tied: readonly Searchable[] = [
      { kind: 'service', type: 'service', slug: 'zeta', title: 'Care', excerpt: null },
      { kind: 'service', type: 'service', slug: 'alpha', title: 'Care', excerpt: null },
    ];
    expect(rankSearch('care', tied).map((hit) => hit.slug)).toEqual(['alpha', 'zeta']);
  });

  it('returns nothing for a term that matches no title or excerpt', () => {
    expect(rankSearch('xylophone', items)).toEqual([]);
  });
});
