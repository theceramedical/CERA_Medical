import type { Page } from '../payload-types.ts';

type PageLayout = NonNullable<Page['layout']>;

/** CMS layout blocks between homepage metrics and CTA — editable in Payload → Pages → home. */
export function homePageMarketingBlocks(): PageLayout {
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
      tone: 'surface',
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
      heading: 'Built for rigorous research',
      body: 'One team for laboratory studies, computational analysis and evidence you can use.',
      tone: 'surface-tint',
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
      heading: 'What you receive',
      body: 'Deliverables are agreed in writing during scoping so everyone knows what “done” looks like before work starts.',
      tone: 'surface',
      steps: [
        {
          title: 'Study or analysis plan',
          description: 'Agreed endpoints, controls, and acceptance criteria before execution.',
        },
        {
          title: 'Results package',
          description:
            'Figures, tables, and methods text suitable for internal review or publication.',
        },
        {
          title: 'Data handover',
          description: 'Processed outputs and metadata transferred through agreed secure channels.',
        },
        {
          title: 'Revision round',
          description:
            'Included discussion and one structured revision cycle on delivered reporting.',
        },
      ],
    },
    {
      blockType: 'processSteps',
      heading: 'How CERA Works',
      body: 'A consistent workflow from first conversation to delivered results, with quality checks at each stage.',
      tone: 'surface-tint-2',
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
          title: 'Analysis and reporting',
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
      body: 'Principles that apply to every service line — from preclinical studies to omics analysis and evidence reports.',
      tone: 'surface-tint',
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
      heading: 'Research insights',
      body: 'Practical guidance on scoping laboratory work, omics analysis, and evidence reporting.',
      viewAllHref: '/articles',
      viewAllLabel: 'View All Articles',
      maxPosts: 3,
    },
    {
      blockType: 'faqList',
      heading: 'Common questions',
      body: 'Quick answers before you submit an enquiry. Full detail lives on the FAQs page.',
      linkHref: '/faqs',
      linkLabel: 'All FAQs',
      items: [
        {
          question: 'How does a project begin?',
          answer:
            'We discuss your research question, available data or materials, required outputs, scope, timeline and cost. The agreed scope is recorded in writing before work begins.',
        },
        {
          question: 'What should I include in an enquiry?',
          answer:
            'Describe the service you need, timeline, and outputs. Do not include participant names or other direct identifiers in the website form.',
        },
        {
          question: 'How quickly will you reply?',
          answer:
            'We aim to respond within three working days with next steps or clarifying questions.',
        },
      ],
    },
    {
      blockType: 'featureGrid',
      heading: 'Explore CERA Medical',
      body: 'Methodology, company background, and how to start a project conversation.',
      tone: 'surface-tint',
      features: [
        {
          title: 'How we work',
          description:
            'Five project stages from scoping through follow-up, with quality checks at each step.',
          href: '/methodology',
          linkLabel: 'Read methodology',
        },
        {
          title: 'About CERA Medical',
          description:
            'Laboratory, computational, and reporting capabilities for biomedical research partners.',
          href: '/about',
          linkLabel: 'About us',
        },
        {
          title: 'Get started',
          description:
            'Contact details, service request guidance, and what happens after you submit.',
          href: '/contact',
          linkLabel: 'Contact',
        },
      ],
    },
  ] as PageLayout;
}

export function servicesPageFacilitiesBlocks(): PageLayout {
  return [
    {
      blockType: 'featureGrid',
      eyebrow: 'Facilities and approach',
      heading: 'Laboratory infrastructure and computational rigour',
      body: 'CERA Medical bridges wet-lab experiments with high-throughput analysis. Our Haripur facility integrates biosafety suites with computational workflows documented from scoping through delivery.',
      tone: 'surface-tint',
      features: [
        {
          title: 'Specialized wet laboratories',
          description:
            'Dedicated biosafety suites for primary cell assays, tissue preparation, and genetic analysis.',
          highlights: [
            { text: 'Animal House: institutional ethical oversight' },
            { text: 'Cell Culture Lab: glioblastoma and primary lines' },
            { text: 'Genomics Lab: validated Sanger sequencing' },
            { text: 'Histopathology: sectioning and fluorescent imaging' },
          ],
        },
        {
          title: 'Computational cluster',
          description:
            'Pipelines for metagenomic, transcriptomic, and clinical datasets with reproducible workflows.',
          highlights: [
            { text: 'Nextflow and Snakemake: reproducible workflows' },
            { text: 'Containerized: Docker/Singularity image lock' },
            { text: 'Versioned repos: full pipeline audits on Git' },
            { text: 'De-identified storage aligned to project agreements' },
          ],
        },
        {
          title: 'Quality assurance protocol',
          description:
            'Standard operating procedures and documented handover chains for every engagement.',
          highlights: [
            { text: 'Traceable batch records for reagents and materials' },
            { text: 'Written protocols agreed before study execution' },
            { text: 'Clear data handover in open formats with summary reports' },
            { text: 'Tables and figures styled for internal or journal review' },
          ],
        },
      ],
    },
    {
      blockType: 'calloutBand',
      eyebrow: 'Haripur regional biomedical research hub',
      heading: 'Empowering South Asian clinical trials and basic science',
      body: 'Operating from our laboratory base in Haripur, Pakistan, CERA Medical combines local research accessibility with documented methods suitable for teaching hospitals, public health programmes, and biotech collaborators.',
    },
  ] as PageLayout;
}
