import { describe, expect, it, vi } from 'vitest';

import {
  ensureHomeMarketingLayout,
  ensurePrivacyPolicyCopy,
  ensureResearchRibbon,
} from './ensure-public-site-layout.ts';

import type { Payload } from 'payload';

describe('ensurePublicSiteLayout', () => {
  it('adds marketing blocks when home only has shell layout', async () => {
    const update = vi.fn().mockResolvedValue({});
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 1,
            layout: [{ blockType: 'hero' }, { blockType: 'statistics' }, { blockType: 'ctaBand' }],
          },
        ],
      }),
      update,
    } as unknown as Payload;

    const changed = await ensureHomeMarketingLayout(payload);
    expect(changed).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        data: expect.objectContaining({
          layout: expect.arrayContaining([
            expect.objectContaining({ blockType: 'servicesShowcase' }),
          ]),
        }),
      }),
    );
  });

  it('enables ribbon when placeholder announcement is present', async () => {
    const updateGlobal = vi.fn().mockResolvedValue({});
    const payload = {
      findGlobal: vi.fn().mockResolvedValue({
        enabled: false,
        statusLabel: 'Lab accredited',
        message: 'confirm accreditation claims',
      }),
      updateGlobal,
    } as unknown as Payload;

    const changed = await ensureResearchRibbon(payload);
    expect(changed).toBe(true);
    expect(updateGlobal).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'announcement',
        data: expect.objectContaining({ enabled: true, statusLabel: 'RESEARCH SERVICES' }),
      }),
    );
  });

  it('replaces the enabled legacy accreditation ribbon without altering editor copy', async () => {
    const updateGlobal = vi.fn().mockResolvedValue({});
    const payload = {
      findGlobal: vi.fn().mockResolvedValue({
        enabled: true,
        statusLabel: 'LAB ACCREDITED',
        message:
          'ISO 17025 Compliant Bio-testing & Metagenomic Workflows — Preclinical Phase Queues Open Q2',
      }),
      updateGlobal,
    } as unknown as Payload;

    expect(await ensureResearchRibbon(payload)).toBe(true);
    expect(updateGlobal).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ statusLabel: 'RESEARCH SERVICES' }),
      }),
    );

    (payload.findGlobal as ReturnType<typeof vi.fn>).mockResolvedValue({
      enabled: false,
      statusLabel: 'Editor announcement',
      message: 'Intake is closed this week.',
    });
    updateGlobal.mockClear();
    expect(await ensureResearchRibbon(payload)).toBe(false);
    expect(updateGlobal).not.toHaveBeenCalled();
  });

  it('removes published privacy drafting instructions and leaves the rest', async () => {
    const update = vi.fn().mockResolvedValue({});
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 4,
            body: {
              root: {
                children: [
                  { children: [{ text: 'Full text for a page titled Privacy Terms.' }] },
                  { children: [{ text: 'Page title: Privacy Terms' }] },
                  { children: [{ text: 'CERA Medical is responsible for this information.' }] },
                ],
              },
            },
          },
        ],
      }),
      update,
    } as unknown as Payload;

    expect(await ensurePrivacyPolicyCopy(payload)).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'policies',
        id: 4,
        data: {
          body: {
            root: {
              children: [
                { children: [{ text: 'CERA Medical is responsible for this information.' }] },
              ],
            },
          },
        },
      }),
    );
  });
});
