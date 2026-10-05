import type { LayoutBlock } from '../components/cms-content-page.tsx';

/**
 * Full homepage stack between metrics and CTA (Stitch reference order).
 *
 * Used when Payload’s `home` page has no marketing blocks — common if the page was created before
 * bootstrap added `homePageMarketingBlocks()`, or layout was cleared in the CMS.
 */
export function defaultHomeMarketingBlocks(): readonly LayoutBlock[] {
  return [
    {
      blockType: 'servicesShowcase',
      heading: 'Research Services',
      body: 'Five integrated service lines — each with enquiry enabled on the catalogue so you can request scoping without leaving the site.',
      viewAllHref: '/services',
      viewAllLabel: 'View All Services',
    },
    {
      blockType: 'featureGrid',
      eyebrow: 'Audience collaboration',
      heading: 'Built for research teams',
      body: 'Laboratory, computational and reporting support for organisations that need reproducible outputs and clear communication.',
      centered: true,
      features: [
        {
          title: 'Universities & institutes',
          description:
            'Support for grant-funded studies that need specialist laboratory or bioinformatics capacity.',
          highlights: [
            { text: 'Written scope before work begins' },
            { text: 'Methods suitable for publication' },
            { text: 'Secure transfer for large datasets' },
          ],
        },
        {
          title: 'Biotech & industry R&D',
          description:
            'Accelerate preclinical and omics programmes without building every capability in-house.',
          highlights: [
            { text: 'Confidential handling by default' },
            { text: 'Coordinated lab and compute workflows' },
            { text: 'Technical reports for decision-making' },
          ],
        },
        {
          title: 'Health & public-sector research',
          description:
            'Evidence synthesis and analysis with clear governance for sensitive or regulated data.',
          highlights: [
            { text: 'De-identified enquiry and project data' },
            { text: 'Retention aligned to policy' },
            { text: 'Staff-only operational notes' },
          ],
        },
      ],
    },
    {
      blockType: 'featureGrid',
      eyebrow: 'Methodological rigor',
      heading: 'Built for rigorous research',
      body: 'One team for laboratory studies, computational analysis and evidence you can use.',
      features: [
        {
          title: 'Laboratory capability',
          description:
            'Preclinical, molecular, genomics, histopathology and microscopy work delivered through coordinated laboratory services.',
        },
        {
          title: 'Computational research',
          description:
            'Bioinformatics, omics analysis and simulation workflows designed for clear, publication-ready outputs.',
        },
        {
          title: 'Confidential by design',
          description:
            'Controlled access, documented methods and a clear process for handling research material and data.',
        },
      ],
    },
    {
      blockType: 'processSteps',
      heading: 'What You Receive',
      body: 'Deliverables are agreed in writing during scoping so everyone knows what “done” looks like before work starts.',
      steps: [
        {
          title: 'Study or analysis plan',
          description:
            'Complete initial technical scoping with methodology, controls, sample acceptance criteria, and explicit delivery milestones.',
        },
        {
          title: 'Results package',
          description:
            'Structured raw and normalized data, high-resolution figures, statistical scripts, and reproducible pipeline documentation.',
        },
        {
          title: 'Data handover',
          description:
            'Secure, checksum-verified encrypted data transfer accompanied by comprehensive data dictionaries and SOPs.',
        },
        {
          title: 'Revision round',
          description:
            'A dedicated follow-up session with principal scientists and biostatisticians to fine-tune plots and report narratives.',
        },
      ],
    },
    {
      blockType: 'processSteps',
      heading: 'How CERA Works',
      body: 'A consistent workflow from first conversation to delivered results, with quality checks at each stage.',
      steps: [
        {
          title: 'Scoping',
          description:
            'Agree the research question, available data or materials, scope, timeline and cost.',
        },
        {
          title: 'Protocol',
          description: 'Prepare the study protocol or analysis plan before work begins.',
        },
        {
          title: 'Execution',
          description:
            'Carry out the agreed work with defined controls, replicates and quality checks.',
        },
        {
          title: 'Analysis & reporting',
          description: 'Deliver results with figures, tables and documented methods.',
        },
        {
          title: 'Follow-up',
          description: 'Discuss delivered work and complete included revision rounds.',
        },
      ],
    },
    {
      blockType: 'featureGrid',
      heading: 'How we work with partners',
      body: 'Four foundational commitments behind every institutional research engagement.',
      features: [
        {
          title: 'Written scope first',
          description:
            'Every engagement records the research question, materials, deliverables, timeline and cost before laboratory or analysis work begins.',
        },
        {
          title: 'Traceable methods',
          description:
            'Protocols, software versions and parameters are documented so results can be reviewed, reproduced, or extended in a follow-on study.',
        },
        {
          title: 'Confidential handling',
          description:
            'Project data and samples are handled under agreed retention and access rules. The public website never collects clinical records.',
        },
        {
          title: 'Clear communication',
          description:
            'You receive a named reference for enquiries, status updates through your account when claimed, and a defined path for revisions.',
        },
      ],
    },
    {
      blockType: 'articlesPreview',
      heading: 'Health Insights & Articles',
      body: 'Practical guidance on scoping laboratory work, omics analysis, and evidence reporting.',
      viewAllHref: '/articles',
      viewAllLabel: 'View All Articles',
      maxPosts: 3,
    },
    {
      blockType: 'faqList',
      heading: 'Common Questions',
      body: 'Quick answers before you submit an enquiry. Full detail lives on the FAQs page.',
      linkHref: '/faqs',
      linkLabel: 'All FAQs',
      items: [
        {
          question: 'What information is needed to start an initial project scoping?',
          answer:
            'We require a brief summary of your research objective, the biological materials or data formats available, estimated specimen volume or sequencing scale, and any critical institutional deadlines. No identifiable patient data should ever be submitted during initial web intake.',
        },
        {
          question: 'How are confidential research data and biological specimens secured?',
          answer:
            'Specimens are accessioned into temperature-monitored, barcoded biostorage with multi-factor access logs. Computational omics data is handled within isolated network partitions featuring AES-256 encryption at rest and TLS 1.3 in transit, backed by reciprocal Non-Disclosure Agreements.',
        },
        {
          question: 'What is the standard turnaround time for a comprehensive enquiry response?',
          answer:
            'Our target response window is three business days. A senior research coordinator evaluates technical feasibility, ethical prerequisites, and computational resource allocation, followed by scheduling a direct scoping teleconference.',
        },
      ],
    },
    {
      blockType: 'featureGrid',
      heading: 'Explore CERA Medical',
      body: 'Methodology, company background, and how to start a project conversation.',
      features: [
        {
          title: 'How we work',
          description:
            'Review our laboratory standard operating procedures, validation pipelines, and governance framework.',
          href: '/methodology',
          linkLabel: 'Read methodology',
        },
        {
          title: 'About CERA Medical',
          description:
            'Discover our biomedical research facilities, executive leadership, and academic affiliations in Haripur.',
          href: '/about',
          linkLabel: 'Institutional overview',
        },
        {
          title: 'Get started',
          description:
            'Connect directly with our study directors to discuss sample handling or custom bioinformatics protocols.',
          href: '/contact',
          linkLabel: 'Direct contact details',
        },
      ],
    },
  ];
}
