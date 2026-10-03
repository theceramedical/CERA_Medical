import { Heading, Text } from '@cera/ui/typography';

import { CmsContentPage } from '../../../components/cms-content-page.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

const sections = [
  {
    title: 'Preclinical studies',
    paragraphs: [
      'In vivo: Study design → model induction → treatment → behavioural testing → tissue collection → tissue analysis → statistics and report. Groups, sample size, doses, endpoints and analyses are defined in a written protocol approved by the animal ethics committee before work begins. Standard behavioural assays may include the Open Field Test, Light-Dark Box and Novel Object Recognition. Tissue analysis may include histology, immunohistochemistry, ELISA and biochemical assays.',
      'In vitro: Model set-up → treatment → cellular assays → mechanism → analysis and report. Cells are exposed across agreed concentrations and time points with untreated, vehicle and reference controls; viability, proliferation and function are measured, and relevant gene or protein pathways are examined.',
      'In silico: Target selection → ligand preparation → molecular docking → pose inspection → molecular dynamics → trajectory analysis → binding free energy → report. The supplied workflow names RCSB PDB, PDBFixer, PubChem, Open Babel, AutoDock Vina, GROMACS, AmberTools, MDAnalysis and gmx_MMPBSA. Simulation duration, replicates and methods are confirmed in the project plan.',
    ],
  },
  {
    title: 'Molecular research',
    paragraphs: [
      'Samples are logged and stored under conditions required by the assay. Genomic variants are characterised with PCR and Sanger sequencing; gene expression with RT-PCR; and protein expression with Western blot or ELISA. Biochemical assays quantify biomarkers in tissue, serum and cell samples. Histology and microscopy work may include H&E or Nissl staining, immunohistochemistry, imaging and quantitative analysis. New methods can be developed and validated for a project, with protocol and performance data delivered.',
    ],
  },
  {
    title: 'Metagenomic data analysis',
    paragraphs: [
      'Shotgun read-based workflow: Data retrieval → quality control → taxonomic classification → functional annotation → diversity analysis → antimicrobial resistance and virulence screening → statistics → report and delivery. Listed tools include FastQC, fastp, KneadData, Kraken2, Bracken, MetaPhlAn, HUMAnN, eggNOG, QIIME 2, R, CARD/RGI, VFDB, ABRicate, DESeq2 and MaAsLin2.',
      'Genome-resolved workflow: Assembly → assembly quality control → coverage and binning → bin quality → dereplication → taxonomy → annotation → abundance and association analysis.',
      '16S/ITS workflow: Read quality control → denoising → taxonomy → data integration → diversity analysis → differential abundance → optional functional prediction.',
      'Analytical standards in the client brief include recording tools, versions and parameters; reporting sample counts and exclusions; accounting for run, lane and batch structure; examining covariates; and delivering scripts and intermediate files for reproducibility. The stated service inputs include FASTQ, FASTA and public repository accessions with sample metadata.',
    ],
  },
  {
    title: 'Biomedical and omics data analysis',
    paragraphs: [
      'Project workflow: Scoping → data intake and audit → cleaning and quality control → processing and annotation → statistical analysis and modelling → validation → report and revisions. The project plan defines the validation approach, covariates, deliverables and handling requirements for de-identified clinical or biological data.',
    ],
  },
  {
    title: 'Evidence synthesis and technical reports',
    paragraphs: [
      'Project workflow: Question and protocol → literature search → screening → data extraction and appraisal → synthesis and analysis → report writing → review and delivery. The service brief includes systematic reviews and meta-analyses reported to PRISMA, health-sector assessments, donor and technical reports, policy briefs, and survey or programme-data analysis.',
    ],
  },
] as const;

const stages = [
  [
    'Scoping',
    'Agree the research question, available material or data, output, scope, timeline and cost in writing.',
  ],
  [
    'Protocol',
    'Prepare the study protocol or analysis plan before work begins. Animal studies require ethics committee approval first.',
  ],
  [
    'Execution',
    'Carry out the work with controls, replicates and quality checks defined in the protocol.',
  ],
  [
    'Analysis and reporting',
    'Analyse results using documented methods and deliver agreed reports, figures, tables and methods text.',
  ],
  [
    'Follow-up',
    'Discuss results after delivery and complete the revision rounds agreed for the project.',
  ],
] as const;

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Methodology',
    description:
      'How CERA Medical scopes, conducts, analyses and reports research service projects.',
    path: '/methodology',
  });
}

export default async function MethodologyPage() {
  const document = await getCurrentDocument('page', 'methodology');
  if (document !== null) return <CmsContentPage document={document} />;
  return (
    <>
      <PageHeader
        title="How We Work"
        lede="Every project follows five stages, with service-specific methods set out in a protocol or analysis plan."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {stages.map(([title, description], index) => (
            <li key={title} className="rounded-lg bg-surface-tint p-5">
              <Text size="eyebrow" tone="muted">
                Stage {index + 1}
              </Text>
              <Heading level={2} size="h4" className="mt-2">
                {title}
              </Heading>
              <Text size="body-sm" className="mt-3">
                {description}
              </Text>
            </li>
          ))}
        </ol>

        {sections.map((section) => (
          <section key={section.title} className="mt-12 max-w-measure">
            <Heading level={2} size="h3">
              {section.title}
            </Heading>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} className="mt-4">
                {paragraph}
              </Text>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
