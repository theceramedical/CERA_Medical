import { describe, expect, it } from 'vitest';

import { serviceHeroFromLayout } from './service-hero.ts';

describe('serviceHeroFromLayout', () => {
  it('uses laboratory collection defaults for new slugs without a hero block', () => {
    const hero = serviceHeroFromLayout('university-of-swabi', [], 'laboratory-research');
    expect(hero.eyebrow).toContain('Laboratory service line');
    expect(hero.badges.length).toBeGreaterThan(0);
    expect(hero.noticeTitle).toBe('Research samples');
  });

  it('ignores an empty serviceHero block and keeps category defaults', () => {
    const hero = serviceHeroFromLayout(
      'custom-assay',
      [{ blockType: 'serviceHero', badges: [] }],
      'laboratory-research',
    );
    expect(hero.eyebrow).toContain('Laboratory service line');
  });
});
