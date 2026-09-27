import { describe, expect, it } from 'vitest';

import { mapCmsDocument } from './map.ts';

describe('mapCmsDocument', () => {
  it('validates a published post against ContentDocumentSchema', () => {
    const document = mapCmsDocument('post', {
      id: '1',
      slug: '5-simple-habits-for-a-healthier-you',
      title: '5 Simple Habits for a Healthier You',
      excerpt: 'Small changes.',
      body: { root: { children: [] } },
      _status: 'published',
      authorId: 'e',
      approverId: 'a',
      publishedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2025-12-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(document.status).toBe('published');
    expect(document.type).toBe('post');
  });

  it('treats a missing _status as a draft, so a leak cannot hide as published', () => {
    const document = mapCmsDocument('page', {
      id: '2',
      slug: 'about',
      title: 'About CERA Medical',
      createdAt: '2025-12-01T00:00:00.000Z',
      updatedAt: '2025-12-01T00:00:00.000Z',
    });

    expect(document.status).toBe('draft');
    expect(document.publishedAt).toBeNull();
  });
});
