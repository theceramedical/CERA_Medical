import { afterEach, describe, expect, it, vi } from 'vitest';

import { bootstrapClientContent } from './bootstrap-content.ts';

import type { Payload } from 'payload';

describe('bootstrapClientContent', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('loads the approved copy into editable, published CMS documents', async () => {
    vi.stubEnv('CMS_BOOTSTRAP_ADMIN_EMAIL', 'owner@example.org');
    vi.stubEnv('CMS_BOOTSTRAP_ADMIN_PASSWORD', 'a'.repeat(40));
    let categorySeq = 0;
    const create = vi.fn().mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'categories') {
        categorySeq += 1;
        return Promise.resolve({ id: categorySeq });
      }
      return Promise.resolve({});
    });
    const update = vi.fn().mockResolvedValue({});
    const find = vi
      .fn()
      .mockImplementation(({ collection }: { collection: string }) =>
        Promise.resolve({ docs: collection === 'users' ? [] : [], totalDocs: 0 }),
      );
    const updateGlobal = vi.fn().mockResolvedValue({});
    const payload = {
      findGlobal: vi.fn().mockResolvedValue({ email: 'theceramedica@gmail.com' }),
      updateGlobal,
      find,
      create,
      update,
    } as unknown as Payload;

    await bootstrapClientContent(payload);

    expect(create).toHaveBeenCalledTimes(19);
    expect(create).toHaveBeenCalledWith({
      collection: 'users',
      data: { email: 'owner@example.org', password: 'a'.repeat(40), role: 'administrator' },
      overrideAccess: true,
    });
    expect(updateGlobal).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'site-settings',
        data: { email: 'contact@ceramedical.org' },
      }),
    );
    const records = create.mock.calls
      .map((call) => call[0] as { collection: string; data: Record<string, unknown> })
      .filter((record) => record.collection !== 'users');
    expect(records.filter((record) => record.collection === 'service-presentations')).toHaveLength(
      5,
    );
    expect(
      records.filter((record) => record.collection === 'pages').map((record) => record.data.slug),
    ).toEqual(['home', 'services', 'about', 'methodology', 'contact']);
    const home = records.find((record) => record.data.slug === 'home')?.data;
    expect(home?.layout).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockType: 'hero',
          headlinePrimary: 'Research Services,',
          headlineAccent: 'From Study to Report.',
        }),
        expect.objectContaining({ blockType: 'ctaBand', href: '/enquiry' }),
      ]),
    );
    expect(
      records.find((record) => record.data.slug === 'privacy-policy')?.data.effectiveDate,
    ).toBe('2026-10-03');
    const publishedRecords = records.filter((record) => record.collection !== 'categories');
    expect(
      publishedRecords.every(
        (record) => record.data.fixture === false && record.data._status === 'published',
      ),
    ).toBe(true);
    expect(
      records.every(
        (record) =>
          typeof record.data.seo !== 'object' ||
          record.data.seo === null ||
          !('description' in record.data.seo) ||
          typeof record.data.seo.description !== 'string' ||
          record.data.seo.description.length <= 180,
      ),
    ).toBe(true);
    expect(JSON.stringify(records)).not.toContain('medicalcera@gmail.com');
    expect(JSON.stringify(records)).not.toContain('[Analytics data]');
    expect(JSON.stringify(records)).not.toContain('[30 days]');
    expect(JSON.stringify(records)).toContain('Germany');
  });

  it('preserves existing editable content instead of overwriting CMS changes', async () => {
    const create = vi.fn();
    const update = vi.fn();
    const payload = {
      findGlobal: vi.fn().mockResolvedValue({ email: 'contact@ceramedical.org' }),
      updateGlobal: vi.fn(),
      find: vi.fn().mockResolvedValue({ docs: [{ id: 'existing', fixture: false }], totalDocs: 1 }),
      create,
      update,
    } as unknown as Payload;

    await bootstrapClientContent(payload);

    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses to bootstrap content without a secure first CMS administrator', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
      create: vi.fn(),
    } as unknown as Payload;

    await expect(bootstrapClientContent(payload)).rejects.toThrow(
      'A first CMS administrator is required',
    );
    expect(payload.create).not.toHaveBeenCalled();
  });
});
