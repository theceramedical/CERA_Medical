import { describe, expect, it } from 'vitest';

import { safeDiff } from './safe-diff.ts';

describe('safeDiff', () => {
  it('returns null when nothing changed', () => {
    expect(safeDiff({ status: 'draft' }, { status: 'draft' })).toBeNull();
    expect(safeDiff(null, null)).toBeNull();
  });

  it('records allow-listed fields by value', () => {
    expect(safeDiff({ status: 'draft' }, { status: 'published' })).toEqual({
      status: { from: 'draft', to: 'published' },
    });
  });

  it('records free-text and unknown fields as changed, without values', () => {
    const diff = safeDiff(
      { title: 'Old title', message: 'patient reports chest pain', mystery: 'abc' },
      { title: 'New title', message: 'patient reports chest pain and nausea', mystery: 'xyz' },
    );

    expect(diff).toEqual({
      title: { changed: true },
      message: { changed: true },
      mystery: { changed: true },
    });
    expect(JSON.stringify(diff)).not.toContain('chest');
    expect(JSON.stringify(diff)).not.toContain('nausea');
    expect(JSON.stringify(diff)).not.toContain('Old title');
  });

  it('keeps allow-listed identifiers and drops everything else in one pass', () => {
    const diff = safeDiff(
      { status: 'draft', phone: '+441632960541', slug: 'about' },
      { status: 'published', phone: '+441632960000', slug: 'about' },
    );

    expect(diff).toEqual({
      status: { from: 'draft', to: 'published' },
      phone: { changed: true },
    });
    expect(JSON.stringify(diff)).not.toContain('441632');
  });

  it('treats a Date and its ISO string as the same value', () => {
    const at = new Date('2026-01-15T09:00:00.000Z');

    expect(safeDiff({ createdAt: at }, { createdAt: at.toISOString() })).toBeNull();
  });
});
