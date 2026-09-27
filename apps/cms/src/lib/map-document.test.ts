import { describe, expect, it } from 'vitest';

import { mapDocument } from './map-document.ts';

describe('mapDocument', () => {
  it('round-trips a published post onto ContentDocumentSchema', () => {
    const document = mapDocument('post', {
      id: 'abc',
      slug: '5-simple-habits-for-a-healthier-you',
      title: '5 Simple Habits for a Healthier You',
      excerpt: 'Small changes.',
      body: { root: { type: 'root', children: [] } },
      seo: { title: 'Habits | CERA', description: 'Small changes.', ogImage: { id: 'og-1' } },
      cover: { id: 'cover-1' },
      _status: 'published',
      authorId: 'editor-1',
      approverId: 'approver-1',
      publishedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2025-12-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(document.status).toBe('published');
    expect(document.mediaIds).toEqual(['cover-1']);
    expect(document.seo.ogImageId).toBe('og-1');
    expect(document.type).toBe('post');
  });

  it('rejects a document that would fail the contract', () => {
    expect(() =>
      mapDocument('page', {
        id: 'x',
        slug: 'Not-A-Slug',
        title: 'About',
        _status: 'published',
      }),
    ).toThrow();
  });
});
