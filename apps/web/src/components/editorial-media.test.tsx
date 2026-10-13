import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { mapCmsDocument } from '../lib/cms/map.ts';

import { CmsContentPage } from './cms-content-page.tsx';
import { ContentGallery } from './content-gallery.tsx';

describe('CMS editorial media rendering', () => {
  it('renders the CMS body, team photo, biography and profile link on a page', () => {
    const document = mapCmsDocument('page', {
      id: 1,
      slug: 'about',
      title: 'Our laboratory',
      teamHeading: 'Our people',
      teamIntroduction: 'Meet the research team.',
      teamMembers: [
        {
          name: 'QA Researcher',
          role: 'Scientist',
          biography: 'Studies microbiomes.',
          photo: { url: 'https://media.example/portrait.jpg', alt: 'Portrait of QA Researcher' },
          links: [{ label: 'ORCID', url: 'https://orcid.org/0000-0000-0000-0000' }],
        },
      ],
      gallery: [{ url: 'https://media.example/lab.jpg', alt: 'Laboratory' }],
    });
    const html = renderToStaticMarkup(<CmsContentPage document={document} />);
    expect(html).toContain('Our laboratory');
    expect(html).toContain('Our people');
    expect(html).toContain('Studies microbiomes.');
    expect(html).toContain('https://media.example/portrait.jpg');
    expect(html).toContain('https://orcid.org/0000-0000-0000-0000');
    expect(html).toContain('Laboratory');
  });

  it('renders no empty gallery and provides access to full images', () => {
    expect(renderToStaticMarkup(<ContentGallery images={[]} />)).toBe('');
    const html = renderToStaticMarkup(
      <ContentGallery images={[{ url: 'https://media.example/a.jpg', alt: 'Microscope' }]} />,
    );
    expect(html).toContain('href="https://media.example/a.jpg"');
    expect(html).toContain('alt="Microscope"');
  });
});
