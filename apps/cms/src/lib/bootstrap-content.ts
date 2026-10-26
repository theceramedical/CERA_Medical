import clientCopy from '../content/client-website-content.json' with { type: 'json' };

import { homePageMarketingBlocks, servicesPageFacilitiesBlocks } from './bootstrap-home-layout.ts';
import { buildServicePresentationLayout } from './bootstrap-service-layout.ts';
import {
  ensureHomeMarketingLayout,
  ensurePrivacyPolicyCopy,
  ensureResearchRibbon,
  RESEARCH_RIBBON,
} from './ensure-public-site-layout.ts';

import type { Page, ServicePresentation } from '../payload-types.ts';
import type { Payload, PayloadRequest, RequiredDataFromCollectionSlug } from 'payload';

/** Publication hooks treat local, unauthenticated API calls as system bootstrap (see publication.ts). */
function systemReq(payload: Payload): PayloadRequest {
  return {
    payload,
    payloadAPI: 'local',
    user: undefined,
  } as unknown as PayloadRequest;
}

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

type ServiceCardIcon = NonNullable<ServicePresentation['cardIcon']>;

const SERVICE_CARD_ICONS: Record<string, ServiceCardIcon> = {
  'preclinical-studies': 'microscope',
  'molecular-research': 'dna',
  'biomedical-data-analysis': 'database',
  'metagenomic-data-analysis': 'database',
};

function lexicalFromStrings(paragraphs: readonly string[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            version: 1,
          },
        ],
      })),
    },
  };
}

function lexical(paragraphs: readonly SourceParagraph[]) {
  const children = paragraphs
    .filter(
      (item) =>
        !pageHeading.test(item.text) &&
        !item.text.startsWith('CERA Medical website content') &&
        !item.text.startsWith('Text for a "How we work') &&
        !/^(?:Label|Heading|Tag|Grid summary|Description|Button):/.test(item.text) &&
        !item.text.startsWith('Full text for a page titled') &&
        !item.text.startsWith('Page title:') &&
        !item.text.startsWith('Effective date:'),
    )
    .map((item) => {
      const heading = item.style.startsWith('Heading');
      const level = Number(item.style.replace('Heading ', ''));
      if (heading) {
        return {
          type: 'heading',
          tag: level <= 2 ? 'h2' : 'h3',
          format: '' as const,
          indent: 0,
          version: 1,
          direction: 'ltr' as const,
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
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
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
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children,
    },
  };
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
  collection: 'pages' | 'policies' | 'service-presentations' | 'posts' | 'projects',
  slug: string,
  data: RequiredDataFromCollectionSlug<
    'pages' | 'policies' | 'service-presentations' | 'posts' | 'projects'
  >,
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
  const req = systemReq(payload);
  if (existing === undefined) {
    await payload.create({
      collection,
      data: record,
      overrideAccess: true,
      draft: false,
      req,
    });
  } else {
    await payload.update({
      collection,
      id: existing.id,
      data: record,
      overrideAccess: true,
      draft: false,
      req,
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
  const currentSettings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
  const dynamicSettings = currentSettings as unknown as Record<string, unknown>;
  const formSettings = (dynamicSettings.enquiryForm ?? {}) as Record<string, unknown>;
  const faqDefaults = [
    {
      question: 'Which services does CERA Medical provide?',
      answer:
        'The portfolio includes preclinical studies, molecular research, metagenomic data analysis, biomedical and omics data analysis, and evidence synthesis and technical reports.',
    },
    {
      question: 'How does a project begin?',
      answer:
        'CERA Medical first discusses the research question, available materials or data, required outputs, scope, timeline and cost. The agreed scope is recorded in writing before work begins.',
    },
    {
      question: 'How quickly will you reply?',
      answer: 'The team aims to reply to a service request within three working days.',
    },
    {
      question: 'What should I include in my request?',
      answer:
        'Describe the research question, samples, compounds or data, timeline and outputs you need. Do not include participant names or other direct identifiers in the website form.',
    },
    {
      question: 'How do I transfer large datasets or samples?',
      answer:
        'Large datasets are transferred later using an agreed secure link or retrieved from a provider or public repository. Arrange physical sample shipping with CERA Medical before sending materials.',
    },
    {
      question: 'When can animal studies start?',
      answer:
        'Animal-study protocols must be approved by the institutional animal ethics committee before the study begins.',
    },
    {
      question: 'How long does metagenomic analysis take?',
      answer:
        'The client brief gives a three-week delivery target for metagenomic analysis. The actual timeline should be confirmed during project scoping.',
    },
  ];
  const statements = {
    sequencingConsent: [
      'I am authorised to share these data with CERA Medical for analysis and, where I ask CERA Medical to download them from a server or repository, to give it access for that purpose.',
      'Where the data derive from human participants, the study holds the necessary ethical approval and participant consent, and that consent permits analysis by an external service provider.',
      'The files and metadata are de-identified and contain no names, contact details, national identity numbers, medical record numbers or other direct identifiers.',
      'I understand that sequencing reads from human samples may contain human genetic material, which CERA Medical removes during quality control and does not analyse for any other purpose.',
      'CERA Medical may store and process the data for this analysis and will delete them as set out in the Data Retention Policy.',
    ].map((statement) => ({ statement })),
    samplesConsent: [
      'I own these materials or am authorised to send them to CERA Medical for the agreed study.',
      'Where samples derive from human donors, the necessary ethical approval and donor consent are in place, and the samples are coded and carry no names or other direct identifiers.',
      'I have disclosed every known hazard of the materials, including infectious, toxic and radioactive hazards, and will supply a safety data sheet for each test compound.',
      'CERA Medical may use the materials only for the agreed study and will return or destroy any remainder as set out in the Data Retention Policy.',
      'I understand that animal studies begin only after the protocol has been approved by the animal ethics committee.',
    ].map((statement) => ({ statement })),
    healthDataConsent: [
      'My organisation owns these data or is authorised to share them with CERA Medical for analysis.',
      'The data were collected with the consent and approvals required for their use in analysis and reporting.',
      'The dataset has been de-identified and contains no names, national identity numbers, medical record numbers, telephone numbers, addresses or household coordinates, or, where identifiers are needed for the analysis, a data sharing agreement will be signed before any data are transferred.',
      'Where data include sequencing reads from human samples, CERA Medical removes human genetic material during quality control and does not analyse it for any other purpose.',
      "CERA Medical may use the data only for the agreed analysis and report, will follow my organisation's data protection requirements, and will return or delete the data as set out in the Data Retention Policy or in the data sharing agreement.",
    ].map((statement) => ({ statement })),
  };
  const settingsPatch: Record<string, unknown> = {};
  if (!Array.isArray(dynamicSettings.faqs) || dynamicSettings.faqs.length === 0)
    settingsPatch.faqs = faqDefaults;
  if (
    !Array.isArray(dynamicSettings.contactLocations) ||
    dynamicSettings.contactLocations.length === 0
  ) {
    settingsPatch.contactLocations = [
      {
        label: 'Email',
        value: 'contact@ceramedical.org',
        href: 'mailto:contact@ceramedical.org',
        icon: 'mail',
      },
      {
        label: 'Laboratory',
        value:
          'B2-105, B2 Building, Department of Biological and Health Sciences, PAF-IAST, Haripur, Pakistan',
        icon: 'mapPin',
      },
      {
        label: 'Office',
        value:
          '2nd Floor, BIC, C2 Building, Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST), Mang, Haripur, Pakistan',
        icon: 'mapPin',
      },
    ];
  }
  const contactEnquiry = dynamicSettings.contactEnquiry as Record<string, unknown> | undefined;
  if (contactEnquiry?.heading === undefined || contactEnquiry.heading === '') {
    settingsPatch.contactEnquiry = {
      heading: 'Enquiring about a service?',
      body: 'Describe the research service you need and your project requirements. Please do not include participant names or other direct identifiers. Large datasets can be transferred later through a secure link; arrange physical sample shipping with us first.',
      buttonLabel: 'Make an Enquiry',
      buttonHref: '/enquiry?source=web_contact_page',
      formSectionTitle: 'Service request form',
      showInlineForm: false,
    };
  }
  const enquiry = (dynamicSettings.enquiryForm ?? {}) as Record<string, unknown>;
  if (!Array.isArray(enquiry.extraServices) || enquiry.extraServices.length === 0) {
    settingsPatch.enquiryForm = {
      ...enquiry,
      extraServices: [
        { slug: 'research-collaboration', title: 'Research collaboration' },
        { slug: 'other-enquiry', title: 'Other enquiry' },
      ],
    };
  }
  if (!formSettings.consentVersion)
    settingsPatch.enquiryForm = {
      ...formSettings,
      consentVersion: 'cera-brief-2026-10-03-v1',
      ...Object.fromEntries(
        Object.entries(statements)
          .filter(([key]) => !Array.isArray(formSettings[key]))
          .map(([key, value]) => [key, value]),
      ),
    };
  else {
    const missing = Object.fromEntries(
      Object.entries(statements)
        .filter(([key]) => !Array.isArray(formSettings[key]))
        .map(([key, value]) => [key, value]),
    );
    if (Object.keys(missing).length > 0)
      settingsPatch.enquiryForm = { ...formSettings, ...missing };
  }
  if (Object.keys(settingsPatch).length > 0) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: settingsPatch,
      overrideAccess: true,
    });
  }

  const announcement = await payload.findGlobal({ slug: 'announcement', overrideAccess: true });
  const ann = announcement as { enabled?: boolean; statusLabel?: string };
  if (!ann.statusLabel) {
    await payload.updateGlobal({
      slug: 'announcement',
      data: {
        ...RESEARCH_RIBBON,
      },
      overrideAccess: true,
    });
  }
  const services = [
    {
      slug: 'preclinical-studies',
      title: 'Preclinical Studies',
      serviceId: 'preclinical-studies',
      excerpt: 'Safety and efficacy testing in animal models, in cells and by computer simulation.',
      intro:
        'We establish whether a candidate treatment is safe and effective before it reaches human trials. Studies are carried out in animal models, in cell-based systems or by computer simulation. Animal studies begin only after the institutional animal ethics committee has approved the written protocol, and all studies are designed, conducted and documented in line with the principles of Good Laboratory Practice. These are research services, not clinical care.',
    },
    {
      slug: 'molecular-research',
      title: 'Molecular Research',
      serviceId: 'molecular-research',
      excerpt: 'Molecular, biochemical and histological analysis of research samples.',
      intro:
        'We provide molecular, biochemical and histological analysis of research samples in our Genomics, Histopathology and Microscopy Labs. Human-derived samples must be coded and supplied without direct identifiers, with ethical approval and donor consent in place.',
    },
    {
      slug: 'biomedical-data-analysis',
      title: 'Biomedical Data Analysis',
      serviceId: 'biomedical-data-analysis',
      excerpt: 'Metagenomic, health and omics data analysed through to publication-ready results.',
      intro:
        "We analyse biomedical data from raw files through to publication-ready figures, tables and results text, with metagenomics as our speciality. Data are supplied de-identified, remain the client's property, are kept confidential and are deleted in line with our Data Retention Policy.",
    },
  ] as const;
  for (const service of services) {
    const { slug, title, serviceId, excerpt, intro } = service;
    const cardIcon = SERVICE_CARD_ICONS[slug];
    await upsert(payload, 'service-presentations', slug, {
      title,
      slug,
      serviceId,
      excerpt,
      ...(cardIcon !== undefined ? { cardIcon } : {}),
      body: lexicalFromStrings([intro]),
      layout: buildServicePresentationLayout(slug),
      seo: {
        title: `${title} | CERA Medical`,
        description: excerpt,
      },
    });
  }

  const intro = publicText(range('Section introduction', '1.1 Preclinical Studies'));
  const introduction =
    intro
      .find((item) => item.text.startsWith('Introduction:'))
      ?.text.replace('Introduction: ', '') ?? '';
  await upsert(payload, 'pages', 'home', {
    title: 'CERA Medical',
    slug: 'home',
    excerpt: introduction,
    layout: [
      {
        blockType: 'hero',
        eyebrow: 'Biomedical Research and Development',
        headlinePrimary: 'Research Services,',
        headlineAccent: 'From Study to Report.',
        body: 'CERA Medical partners with universities, biotech teams and health organisations on preclinical studies, molecular laboratory work, metagenomic and omics analysis, and evidence synthesis — with documented methods from scoping through delivery.',
        primaryHref: '/services',
        primaryLabel: 'Explore Services',
        secondaryHref: '/enquiry',
        secondaryLabel: 'Make an Enquiry',
        badgeTitle: 'Scope before samples move',
        badgeBody:
          'Every project starts with a written plan, agreed timelines, and outputs you can trace.',
        trustItems: [
          { label: 'Documented methods' },
          { label: 'Reproducible analysis' },
          { label: 'Research team support' },
        ],
      },
      {
        blockType: 'statistics',
        items: [
          {
            value: '5',
            label: 'Research service lines',
            detail: 'End-to-end wet & dry lab',
          },
          {
            value: '5',
            label: 'Agreed project stages',
            detail: 'Rigorous QC milestones',
          },
          {
            value: '3 days',
            label: 'Target enquiry response',
            detail: 'Rapid preliminary scoping',
          },
          {
            value: '1 team',
            label: 'Lab, data & reporting',
            detail: 'Cross-disciplinary alignment',
          },
        ],
      },
      ...homePageMarketingBlocks(),
      {
        blockType: 'ctaBand',
        headline: 'Ready to advance your research?',
        body: 'Share your research question, materials or datasets. We respond within three working days with next steps — no clinical records on this form.',
        href: '/enquiry',
        label: 'Make an Enquiry',
      },
    ] as NonNullable<Page['layout']>,
    body: lexical(intro),
    seo: {
      title: 'CERA Medical | Biomedical Research and Development',
      description:
        'Biomedical research and development across preclinical studies, laboratory research, microbiome and omics analysis, and evidence synthesis.',
    },
  });
  await upsert(payload, 'pages', 'services', {
    title: 'Complete Service Portfolio',
    slug: 'services',
    excerpt:
      intro
        .find((item) => item.text.startsWith('Introduction:'))
        ?.text.replace('Introduction: ', '') ?? '',
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'Biomedical research services',
        heading: 'Complete Service Portfolio',
        body: 'CERA Medical provides biomedical research and development services. We support principal investigators, biotech developers, and academic institutions through validated analytical protocols and strict ethical frameworks.',
        badges: [
          { label: 'Animal ethics approval before studies' },
          { label: 'Studies follow GLP principles' },
          { label: 'Reproducible Omics Pipelines' },
        ],
      },
      { blockType: 'servicesCatalogue' },
      ...servicesPageFacilitiesBlocks(),
      {
        blockType: 'ctaBand',
        headline: 'Ready to scope your research study?',
        body: 'Share your research question, materials or datasets. We respond within three working days with next steps — no clinical records on this form.',
        href: '/enquiry',
        label: 'Make an Enquiry',
      },
    ] as NonNullable<Page['layout']>,
    body: lexicalFromStrings([]),
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
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'About CERA Medical',
        heading: 'About CERA Medical',
        body: 'A biomedical research and development company providing laboratory, computational and evidence services.',
      },
    ],
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
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'Methodology',
        heading: 'How We Work',
        body: 'Every project follows five stages, with service-specific methods set out in a protocol or analysis plan.',
      },
    ],
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
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'Study scoping and contact',
        heading: 'Contact us',
        body: 'For project enquiries, contact CERA Medical by email or use the service request form. We aim to reply within three working days.',
      },
    ],
    body: lexical(contact),
    seo: {
      title: 'Contact CERA Medical',
      description: 'Contact CERA Medical about research services.',
    },
  });
  await upsert(payload, 'pages', 'articles', {
    title: 'Research Updates',
    slug: 'articles',
    excerpt: 'Project news and research articles approved for publication by CERA Medical.',
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'Insights and methods',
        heading: 'Research Updates',
        body: 'Project news and research articles approved for publication by CERA Medical.',
      },
    ],
    body: lexicalFromStrings([]),
    seo: {
      title: 'Research Updates | CERA Medical',
      description: 'Research updates published by CERA Medical.',
    },
  });
  await upsert(payload, 'pages', 'search', {
    title: 'Search',
    slug: 'search',
    excerpt: 'Find a service or an article.',
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'Site search',
        heading: 'Search',
        body: 'Find a service or an article.',
      },
    ],
    body: lexicalFromStrings([]),
    seo: {
      title: 'Search | CERA Medical',
      description: 'Search CERA Medical services and articles.',
      noIndex: true,
    },
  });
  await upsert(payload, 'pages', 'enquiry', {
    title: 'Make an Enquiry',
    slug: 'enquiry',
    excerpt:
      'Tell us which service you are interested in and how to reach you. We will confirm by email and you can follow progress in your account.',
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'Project enquiry',
        heading: 'Make an Enquiry',
        body: 'Tell us which service you are interested in and how to reach you. We will confirm by email and you can follow progress in your account.',
      },
    ],
    body: lexicalFromStrings([]),
    seo: {
      title: 'Make an Enquiry | CERA Medical',
      description: 'Submit an enquiry about a CERA Medical service and track it in your account.',
    },
  });
  await upsert(payload, 'pages', 'sitemap', {
    title: 'Sitemap',
    slug: 'sitemap',
    excerpt: 'Every page on this site, in one list.',
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'Site map',
        heading: 'Sitemap',
        body: 'Every page on this site, in one list. If the navigation has not turned up what you need, it is here.',
      },
    ],
    body: lexicalFromStrings([
      'Individual service pages are listed with the catalogue. Approved research updates appear when CERA Medical publishes them.',
    ]),
    seo: {
      title: 'Sitemap | CERA Medical',
      description: 'Every page on the CERA Medical website, in one list.',
    },
  });
  await upsert(payload, 'pages', 'faqs', {
    title: 'Research Service FAQs',
    slug: 'faqs',
    excerpt: 'Answers about CERA Medical research services and project enquiries.',
    layout: [
      {
        blockType: 'sectionHeading',
        eyebrow: 'Support',
        heading: 'Research Service FAQs',
        body: 'Answers about CERA Medical’s research services and project requests.',
      },
    ],
    body: lexicalFromStrings([]),
    seo: {
      title: 'Research Service FAQs | CERA Medical',
      description: 'Answers about CERA Medical research services and project enquiries.',
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

  try {
    await bootstrapProjectDrafts(payload);
    await bootstrapInsightPosts(payload);
  } catch (error) {
    // Insight posts are additive. A partial failure must not block the rest of
    // bootstrap or roll back a production release — homepage cards are static.
    console.error('bootstrapInsightPosts failed:', error);
  }

  await ensureHomeMarketingLayout(payload);
  await ensureResearchRibbon(payload);
  await ensurePrivacyPolicyCopy(payload);
}

/** Idempotently imports the client-approved project cards as unpublished CMS drafts. */
async function bootstrapProjectDrafts(payload: Payload): Promise<void> {
  const projects = [
    {
      slug: 'methamphetamine-induced-neurotoxicity',
      title: 'Methamphetamine-induced neurotoxicity',
      category: 'Preclinical Studies',
      projectStatus: 'Running',
      sortOrder: 10,
      featuredOnHome: true,
      summary:
        'A mouse model of methamphetamine exposure in which a natural compound is tested for protective and restorative effects on recognition memory, neuroinflammation and neuronal cell death.',
    },
    {
      slug: 'social-isolation-stress',
      title: 'Social isolation stress',
      category: 'Preclinical Studies',
      projectStatus: 'Running',
      sortOrder: 20,
      featuredOnHome: false,
      summary:
        'The effect of early-life social isolation on the brain and on behaviour, including vulnerability to drug dependence in later life.',
    },
    {
      slug: 'morphine-dependence',
      title: 'Morphine dependence',
      category: 'Preclinical Studies',
      projectStatus: 'Running',
      sortOrder: 30,
      featuredOnHome: false,
      summary:
        'Mouse models of morphine dependence and withdrawal, used to test candidate treatments and the signalling pathways through which they act.',
    },
    {
      slug: 'nicotine',
      title: 'Nicotine',
      category: 'Preclinical Studies',
      projectStatus: 'Running',
      sortOrder: 40,
      featuredOnHome: false,
      summary:
        'Rodent models of nicotine exposure, in which candidate products are evaluated for their neuroprotective and behavioural effects.',
    },
    {
      slug: 'synthetic-compounds-in-neuroscience',
      title: 'Synthetic compounds in neuroscience',
      category: 'Preclinical Studies',
      projectStatus: 'Running',
      sortOrder: 50,
      featuredOnHome: false,
      summary:
        'Newly synthesised compounds, and compounds modified from a base compound, screened for activity in neurological and behavioural models.',
    },
    {
      slug: 'gut-induced-depression',
      title: 'Gut-induced depression',
      category: 'Preclinical Studies',
      projectStatus: 'Running',
      sortOrder: 60,
      featuredOnHome: false,
      summary:
        'Models in which disturbance of the gut microbiota produces depression-like behaviour, used to study the gut-brain axis and to test interventions.',
    },
    {
      slug: 'natural-products-in-glioblastoma',
      title: 'Natural products in glioblastoma',
      category: 'Preclinical Studies',
      projectStatus: 'Running',
      sortOrder: 70,
      featuredOnHome: true,
      summary:
        'Natural products tested against glioblastoma cell lines for their effect on cell viability and proliferation.',
    },
    {
      slug: 'in-silico-target-studies',
      title: 'In silico target studies',
      category: 'Preclinical Studies',
      projectStatus: 'Running',
      sortOrder: 80,
      featuredOnHome: false,
      summary:
        'Docking and molecular dynamics studies that test whether a compound under investigation binds the inflammatory and cell-death proteins implicated by our animal studies.',
    },
    {
      slug: 'infant-gut-microbiome-development',
      title: 'Infant gut microbiome development',
      category: 'Biomedical Data Analysis',
      projectStatus: 'Completed',
      sortOrder: 10,
      featuredOnHome: true,
      summary:
        'A longitudinal shotgun metagenomic study of infants in a population-based birth cohort in Pakistan, sampled from birth to twelve months and analysed by both genome-resolved and read-based routes, with a data descriptor manuscript and deposition of the raw reads in NCBI SRA.',
    },
    {
      slug: 'mother-and-infant-gut-microbiome',
      title: 'Mother and infant gut microbiome',
      category: 'Biomedical Data Analysis',
      projectStatus: 'Completed',
      sortOrder: 20,
      featuredOnHome: false,
      summary:
        'Species-level profiling of a longitudinal mother-infant cohort, published in a peer-reviewed nutrition journal.',
    },
    {
      slug: 'oral-microbiome-of-pre-school-children',
      title: 'Oral microbiome of pre-school children',
      category: 'Biomedical Data Analysis',
      projectStatus: 'Completed',
      sortOrder: 30,
      featuredOnHome: false,
      summary:
        'A 16S rRNA amplicon study of the salivary microbiome of Pakistani pre-school children, including a comparison of stunted and normal-weight children.',
    },
  ] as const;

  const req = systemReq(payload);
  for (const project of projects) {
    const found = await payload.find({
      collection: 'projects',
      where: { slug: { equals: project.slug } },
      limit: 1,
      draft: true,
      overrideAccess: true,
    });
    if (found.docs[0] !== undefined) continue;
    await payload.create({
      collection: 'projects',
      data: { ...project, _status: 'draft' },
      overrideAccess: true,
      draft: true,
      req,
    });
  }
}

async function categoryId(payload: Payload, slug: string, title: string): Promise<number> {
  const found = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  });
  const existing = found.docs[0];
  if (existing !== undefined) return Number(existing.id);
  const created = await payload.create({
    collection: 'categories',
    data: { title, slug, colourToken: 'accent-fill' },
    overrideAccess: true,
  });
  return Number(created.id);
}

/** Research articles aligned with the public homepage insight cards. */
async function bootstrapInsightPosts(payload: Payload): Promise<void> {
  const author = await payload.find({ collection: 'users', limit: 1, overrideAccess: true });
  const authorId = author.docs[0] !== undefined ? String(author.docs[0].id) : 'bootstrap-admin';

  const researchMethods = await categoryId(payload, 'research-methods', 'RESEARCH METHODS');
  const dataAnalysis = await categoryId(payload, 'data-analysis', 'DATA ANALYSIS');
  const laboratory = await categoryId(payload, 'laboratory', 'LABORATORY');

  const posts = [
    {
      slug: 'planning-metagenomic-submissions',
      title: 'Planning a metagenomic submission',
      category: researchMethods,
      excerpt:
        'What to agree before transfer: read depth, controls, metadata fields, and how de-identified files should be packaged.',
      body: lexicalFromStrings([
        'Agree read depth, controls, and metadata before any large transfer.',
        'Package de-identified FASTQ or BAM files with a sample sheet that uses study codes, not participant names.',
        'CERA Medical confirms scope, timeline and deliverables in writing before analysis begins.',
      ]),
    },
    {
      slug: 'omics-quality-control-basics',
      title: 'Omics quality control that reviewers expect',
      category: dataAnalysis,
      excerpt:
        'Documented filtering, batch awareness, and traceable figures — the minimum bar for reproducible biomedical analysis.',
      body: lexicalFromStrings([
        'Record every filtering step, software version, and parameter set used in the pipeline.',
        'Inspect batch effects explicitly and document how they were handled.',
        'Deliver figures with underlying tables so reviewers can trace each panel.',
      ]),
    },
    {
      slug: 'preclinical-study-handoff',
      title: 'Handing off a preclinical study cleanly',
      category: laboratory,
      excerpt:
        'Ethics approvals, compound safety data, and a written protocol before samples move — how CERA scopes animal and in-vitro work.',
      body: lexicalFromStrings([
        'Animal protocols require institutional ethics approval before work starts.',
        'Provide safety data sheets for every test compound and disclose known hazards.',
        'A written protocol defines endpoints, controls, and reporting before samples are shipped.',
      ]),
    },
    {
      slug: 'confocal-imaging-in-the-laboratory',
      title: 'Confocal imaging on the STELLARIS 8',
      category: laboratory,
      excerpt:
        'How CERA uses the Leica STELLARIS 8 and DMi8 workstation for molecular and histological imaging, and what to agree before slides arrive.',
      body: lexicalFromStrings([
        'CERA uses a Leica STELLARIS 8 confocal on a DMi8 workstation for molecular and histological imaging.',
        'Agree sample type, labels, and the figures you need before imaging time is booked.',
        'The microscope is laboratory equipment used in the molecular research service. It is not sold.',
      ]),
    },
    {
      slug: 'plate-based-assays-and-readout',
      title: 'Plate assays, dry baths and readout',
      category: laboratory,
      excerpt:
        'Incubation on a DLAB dry bath and absorbance or fluorescence readout on a Multiskan SkyHigh — what a plate-assay handoff needs.',
      body: lexicalFromStrings([
        'Plate assays move from a temperature-controlled dry bath to a microplate reader.',
        'Send a plate map, incubation time, and the read mode named in the protocol.',
        'Sponsors receive the agreed data. The instruments stay in the laboratory.',
      ]),
    },
    {
      slug: 'documenting-laboratory-methods',
      title: 'Documenting laboratory methods as you work',
      category: researchMethods,
      excerpt:
        'Scale cards, labelled tubes and a bench camera so methods notes match the samples that later appear in a report.',
      body: lexicalFromStrings([
        'A methods note should match the bench: instrument, protocol version, and sample codes.',
        'Photographs with a scale card support the note. They do not replace sample identifiers.',
        'Do not put participant names on tubes, filenames, or free-text labels.',
      ]),
    },
  ] as const;

  for (const post of posts) {
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
      draft: true,
      overrideAccess: true,
    });
    if (existing.docs[0] !== undefined) continue;
    await payload.create({
      collection: 'posts',
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category,
        authorId,
        body: post.body,
        seo: {
          title: `${post.title} | CERA Medical`,
          description: post.excerpt,
        },
        _status: 'draft',
      },
      overrideAccess: true,
      draft: true,
      req: systemReq(payload),
    });
  }

  const navigation = await payload.findGlobal({ slug: 'navigation', overrideAccess: true });
  const header = navigation.header;
  if (!Array.isArray(header) || header.length === 0) {
    await payload.updateGlobal({
      slug: 'navigation',
      data: {
        header: [
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: 'Products', href: '/products' },
          { label: 'Research Updates', href: '/articles' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
        footer: [
          { label: 'Make an Enquiry', href: '/enquiry' },
          { label: 'FAQs', href: '/faqs' },
          { label: 'Privacy Terms', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
        ],
      },
      overrideAccess: true,
    });
  }
}
