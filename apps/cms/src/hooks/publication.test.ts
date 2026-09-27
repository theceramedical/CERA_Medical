import { describe, expect, it } from 'vitest';

import { applyPublicationRules, PublicationForbiddenError } from './publication.ts';

import type { CmsUser } from '../access/roles.ts';

const editor: CmsUser = { id: 'editor-1', role: 'content_editor' };
const approver: CmsUser = { id: 'approver-1', role: 'content_approver' };
const admin: CmsUser = { id: 'admin-1', role: 'administrator' };

describe('applyPublicationRules', () => {
  it('rejects an editor publishing through any path', () => {
    expect(() =>
      applyPublicationRules({
        user: editor,
        incoming: { _status: 'published' },
        existing: { _status: 'draft' },
      }),
    ).toThrow(PublicationForbiddenError);
  });

  it('rejects an anonymous publish, including a crafted REST body', () => {
    expect(() =>
      applyPublicationRules({
        user: null,
        incoming: { _status: 'published' },
        existing: { _status: 'draft' },
      }),
    ).toThrow(/approver/);
  });

  it('rejects an editor unpublishing', () => {
    expect(() =>
      applyPublicationRules({
        user: editor,
        incoming: { _status: 'draft' },
        existing: { _status: 'published' },
      }),
    ).toThrow(PublicationForbiddenError);
  });

  it('lets an approver publish and stamps approverId', () => {
    const result = applyPublicationRules({
      user: approver,
      incoming: { _status: 'published' },
      existing: { _status: 'draft' },
    });

    expect(result.action).toBe('publish');
    expect(result.data.approverId).toBe('approver-1');
    expect(result.data.publishedAt).toEqual(expect.any(String));
  });

  it('lets an administrator unpublish', () => {
    const result = applyPublicationRules({
      user: admin,
      incoming: { _status: 'draft' },
      existing: { _status: 'published' },
    });

    expect(result.action).toBe('unpublish');
  });

  it('lets a local-API seed publish without a user', () => {
    const result = applyPublicationRules({
      user: null,
      incoming: { _status: 'published' },
      existing: { _status: 'draft' },
      system: true,
    });

    expect(result.action).toBe('publish');
    expect(result.data.approverId).toBeNull();
  });

  it('does not rewrite fields on an ordinary draft save', () => {
    const incoming = { _status: 'draft' as const, title: 'Working title' };
    const result = applyPublicationRules({
      user: editor,
      incoming,
      existing: { _status: 'draft' },
    });

    expect(result.action).toBe('none');
    expect(result.data).toBe(incoming);
  });
});
