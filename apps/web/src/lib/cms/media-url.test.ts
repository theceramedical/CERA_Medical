import { describe, expect, it } from 'vitest';

import { publicizeCmsMediaUrl } from './media-url.ts';

describe('publicizeCmsMediaUrl', () => {
  it('rewrites Payload admin file URLs onto S3_PUBLIC_URL', () => {
    process.env.S3_PUBLIC_URL = 'https://media.example/cera-media';
    const out = publicizeCmsMediaUrl('https://admin.example/api/media/file/photo-1200x630.jpg');
    expect(out).toBe('https://media.example/cera-media/photo-1200x630.jpg');
  });

  it('leaves already-public URLs unchanged', () => {
    process.env.S3_PUBLIC_URL = 'https://media.example/cera-media';
    const url = 'https://media.example/cera-media/photo.jpg';
    expect(publicizeCmsMediaUrl(url)).toBe(url);
  });
});
