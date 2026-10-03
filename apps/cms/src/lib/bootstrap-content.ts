import clientCopy from '../content/client-website-content.json' with { type: 'json' };

import type { Payload } from 'payload';

interface SourceParagraph {
  readonly style: string;
  readonly text: string;
}

const source = clientCopy as readonly SourceParagraph[];
const pageHeading = /^Page \d+$/;

function sectionIndex(title: string): number {
  const index = source.findIndex((item) => item.text === title);
  if (index < 0) throw new Error(`Client content is missing section: ${title}`);
  return index;
}

function range(from: string, to: string): readonly SourceParagraph[] {
  return source.slice(sectionIndex(from), sectionIndex(to));
}

function lexical(paragraphs: readonly SourceParagraph[]) {
  const children = paragraphs
    .filter(
      (item) =>
        !pageHeading.test(item.text) &&
        !item.text.startsWith('CERA Medical website content') &&
        !item.text.startsWith('Text for a "How we work') &&
        !/^(?:Label|Heading|Tag|Grid summary|Description|Button):/.test(item.text),
    )
    .map((item) => {
      const heading = item.style.startsWith('Heading');
      const level = Number(item.style.replace('Heading ', ''));
      if (heading) {
        return {
          type: 'heading',
          tag: level <= 2 ? 'h2' : 'h3',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: item.text,
              version: 1,
            },
          ],
        };
      }
      return {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: item.text,
            version: 1,
          },
        ],
      };
    });
  return { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children } };
}

function publicText(paragraphs: readonly SourceParagraph[]): readonly SourceParagraph[] {
  return paragraphs.map((item) => {
    let text = item.text
      .replaceAll('medicalcera@gmail.com', 'contact@ceramedical.org')
      .replaceAll('theceramedica@gmail.com', 'contact@ceramedical.org')
      .replaceAll('theceramedical@gmail.com', 'contact@ceramedical.org')
      .replaceAll('www.ceramed.org', 'www.ceramedical.org')
      .replaceAll('[date of publication]', '3 October 2026')
      .replaceAll('[SMC PVT LTD]', 'CERA Medical')
      .replaceAll('[12 months]', '12 months')
      .replaceAll('[2 years]', '2 years')
      .replaceAll('[90 days]', '90 days')
      .replaceAll('[30 days]', '30 days')
      .replaceAll('[6 months]', '6 months')
      .replaceAll('[ 3 months ]', '3 months')
      .replaceAll('[3 years]', '3 years')
      .replaceAll('[14 days]', '14 days')
      .replaceAll(
        '[1 years, as part of the accounting record]',
        '1 year as part of the accounting record',
      );
    if (text.startsWith('Billing information.')) {
      text =
        'Billing information: we keep invoicing details and payment records required for an agreed project. The website does not collect payment-card details.';
    }
    if (text.startsWith('Orders.')) {
      text =
        'Product orders: the website does not currently accept product orders or collect delivery addresses.';
    }
    if (text.startsWith('Information is stored on [systems located in Pakistan.')) {
      text =
        'CERA Medical production application data is hosted on a server in Germany. Service providers may process information in other locations; contact us for current provider details.';
    }
    if (text.startsWith('[Files are transferred over encrypted connections')) {
      text =
        'The production application is hosted on a Hetzner server. Provider-level server backups are enabled; off-site Cloudflare R2 backups are not currently configured. Contact us for information about the controls used for a specific service.';
    }
    if (text.startsWith('Website server logs. Retention:')) {
      text = 'Website server logs are retained for 90 days and then overwritten automatically.';
    }
    if (text.startsWith('[Analytics data] Retention:')) {
      text =
        'Analytics: the website does not currently use non-essential analytics cookies or analytics tools.';
    }
    if (text.startsWith('[Product orders and delivery details]')) {
      text =
        'Product orders and delivery details are not collected because this website does not currently accept product orders.';
    }
    if (text.startsWith('Backups. Retention: 30 days')) {
      text =
        'Backups: provider-managed server backups follow the retention cycle configured with the hosting provider; they may retain deleted data until that cycle expires.';
    }
    if (text.startsWith('Electronic files are deleted from working storage')) {
      text = text.replace(
        '[The date of deletion or destruction is recorded in the project file.]',
        'The date of deletion or destruction is recorded in the project file.',
      );
    }
    return { ...item, text };
  });
}

async function upsert(
  payload: Payload,
  collection: 'pages' | 'policies' | 'service-presentations',
  slug: string,
  data: Record<string, unknown>,
): Promise<void> {
  const found = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    draft: true,
    overrideAccess: true,
  });
  const existing = found.docs[0] as { id: number | string; fixture?: boolean } | undefined;
  if (existing !== undefined && existing.fixture !== true) return;
  const record = { ...data, fixture: false, _status: 'published' as const };
  if (existing === undefined) {
    await payload.create({ collection, data: record as never, overrideAccess: true, draft: false });
  } else {
    await payload.update({
      collection,
      id: existing.id,
      data: record,
      overrideAccess: true,
      draft: false,
    });
  }
}

/** Inserts the client-approved initial copy once, while preserving subsequent CMS edits. */
export async function bootstrapClientContent(payload: Payload): Promise<void> {
  const users = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
  });
  if (users.docs.length === 0) {
    const email = process.env.CMS_BOOTSTRAP_ADMIN_EMAIL?.trim();
    const password = process.env.CMS_BOOTSTRAP_ADMIN_PASSWORD;
    if (!email || !password || password.length < 32) {
      throw new Error(
        'A first CMS administrator is required: configure CMS_BOOTSTRAP_ADMIN_EMAIL and a unique CMS_BOOTSTRAP_ADMIN_PASSWORD of at least 32 characters.',
      );
    }
    await payload.create({
      collection: 'users',
      data: { email, password, role: 'administrator' },
      overrideAccess: true,
    });
  }

  const siteSettings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
  if (
    !siteSettings.email ||
    siteSettings.email === 'theceramedica@gmail.com' ||
    siteSettings.email === 'medicalcera@gmail.com'
  ) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { email: 'contact@ceramedical.org' },
      overrideAccess: true,
    });
  }
  const services = [
    [
      '1.1 Preclinical Studies',
      '1.2 Molecular Research',
      'preclinical-studies',
      'Preclinical Studies',
    ],
    [
      '1.2 Molecular Research',
      '1.3 Metagenomic Data Analysis',
      'molecular-research',
      'Molecular Research',
    ],
    [
      '1.3 Metagenomic Data Analysis',
      '1.4 Biomedical and Omics Data Analysis',
      'metagenomic-data-analysis',
      'Metagenomic Data Analysis',
    ],
    [
      '1.4 Biomedical and Omics Data Analysis',
      '1.5 Evidence Synthesis and Technical Reports',
      'biomedical-omics-data-analysis',
      'Biomedical and Omics Data Analysis',
    ],
    [
      '1.5 Evidence Synthesis and Technical Reports',
      '1.6 Facilities',
      'evidence-synthesis-technical-reports',
      'Evidence Synthesis and Technical Reports',
    ],
  ] as const;
  for (const [start, end, slug, title] of services) {
    const content = publicText(range(start, end));
    await upsert(payload, 'service-presentations', slug, {
      title,
      slug,
      serviceId: slug,
      excerpt:
        content
          .find((item) => item.text.startsWith('Grid summary:'))
          ?.text.replace('Grid summary: ', '') ?? '',
      body: lexical(content),
      seo: {
        title: `${title} | CERA Medical`,
        description:
          content
            .find((item) => item.text.startsWith('Grid summary:'))
            ?.text.replace('Grid summary: ', '') ?? '',
      },
    });
  }

  const intro = publicText(range('Section introduction', '1.1 Preclinical Studies'));
  await upsert(payload, 'pages', 'home', {
    title: 'CERA Medical',
    slug: 'home',
    excerpt:
      intro
        .find((item) => item.text.startsWith('Introduction:'))
        ?.text.replace('Introduction: ', '') ?? '',
    body: lexical([]),
    seo: {
      title: 'CERA Medical | Biomedical Research and Development',
      description:
        intro
          .find((item) => item.text.startsWith('Introduction:'))
          ?.text.replace('Introduction: ', '') ?? '',
    },
  });
  await upsert(payload, 'pages', 'services', {
    title: 'Complete Service Portfolio',
    slug: 'services',
    excerpt:
      intro
        .find((item) => item.text.startsWith('Introduction:'))
        ?.text.replace('Introduction: ', '') ?? '',
    body: lexical(publicText(range('1.6 Facilities', '1.8 Service request form'))),
    seo: {
      title: 'Research Services | CERA Medical',
      description: 'Research services from CERA Medical.',
    },
  });
  const about = [
    ...range('Section introduction', '1.1 Preclinical Studies'),
    ...range('1.6 Facilities', '1.8 Service request form'),
  ];
  await upsert(payload, 'pages', 'about', {
    title: 'About CERA Medical',
    slug: 'about',
    excerpt: 'Biomedical research and development, laboratory and computational services.',
    body: lexical(publicText(about)),
    seo: {
      title: 'About CERA Medical',
      description: 'Biomedical research and development in Haripur, Pakistan.',
    },
  });
  const methodStart = sectionIndex('2.1 How every project runs');
  const privacyStart = sectionIndex('Part 4. Privacy terms');
  await upsert(payload, 'pages', 'methodology', {
    title: 'How We Work',
    slug: 'methodology',
    excerpt: 'Project methodologies and research pipelines.',
    body: lexical(publicText(source.slice(methodStart, privacyStart))),
    seo: {
      title: 'Methodology | CERA Medical',
      description: 'Research workflows and analysis methods.',
    },
  });
  const contact = publicText(range('1.9 Contact block', 'Part 2. Methodology and pipelines'));
  await upsert(payload, 'pages', 'contact', {
    title: 'Get Started',
    slug: 'contact',
    excerpt: 'Ready to advance your research?',
    body: lexical(contact),
    seo: {
      title: 'Contact CERA Medical',
      description: 'Contact CERA Medical about research services.',
    },
  });

  const legalPrivacyStart = sectionIndex('Part 4. Privacy terms');
  const retentionStart = sectionIndex('Part 5. Data retention policy');
  const privacy = publicText(source.slice(legalPrivacyStart + 1, retentionStart));
  const privacyDate = '2026-10-03';
  await upsert(payload, 'policies', 'privacy-policy', {
    title: 'Privacy Terms',
    slug: 'privacy-policy',
    excerpt: 'How CERA Medical handles enquiries and client project information.',
    effectiveDate: privacyDate,
    versionLabel: '2026-10-03-v1',
    body: lexical(privacy),
    seo: { title: 'Privacy Terms | CERA Medical', description: 'CERA Medical privacy terms.' },
  });
  const retention = publicText(source.slice(retentionStart + 1));
  await upsert(payload, 'policies', 'data-retention-policy', {
    title: 'Data Retention Policy',
    slug: 'data-retention-policy',
    excerpt: 'Retention and deletion periods for enquiries, research data and samples.',
    effectiveDate: privacyDate,
    versionLabel: '2026-10-03-v1',
    body: lexical(retention),
    seo: {
      title: 'Data Retention Policy | CERA Medical',
      description: 'Retention and deletion policy.',
    },
  });
}
