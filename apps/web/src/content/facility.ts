/**
 * Photographs from the CERA laboratory folder.
 * Instruments are shown as equipment used in existing services. They are not catalogue products.
 */

export interface FacilityPhoto {
  readonly src: string;
  readonly alt: string;
  readonly videoSrc?: string;
}

export const FACILITY_HERO: FacilityPhoto = {
  src: '/images/facility/confocal-stellaris.jpg',
  alt: 'Leica STELLARIS 8 confocal microscope on the CERA laboratory bench.',
};

export const SERVICE_PHOTOS: Readonly<Record<string, FacilityPhoto>> = {
  'preclinical-studies': {
    src: '/images/facility/preclinical-handling.jpg',
    alt: 'Gloved handling of a laboratory mouse during a preclinical procedure.',
  },
  'molecular-research': {
    src: '/images/facility/confocal-stellaris.jpg',
    alt: 'Confocal microscope used for molecular and histological imaging.',
    videoSrc: '/videos/products/qpcr-assay.mp4',
  },
  'metagenomic-data-analysis': {
    src: '/images/facility/molecular-bench.jpg',
    alt: 'Labelled tubes, pipettes and reagents on a molecular preparation bench.',
    videoSrc: '/videos/products/tube-preparation.mp4',
  },
  'biomedical-omics-data-analysis': {
    src: '/images/facility/plate-reader.jpg',
    alt: 'Thermo Scientific Multiskan SkyHigh microplate reader.',
  },
  'evidence-synthesis-technical-reports': {
    src: '/images/facility/methods-documentation.jpg',
    alt: 'Camera, scale card and labelled tubes used to document laboratory methods.',
  },
};

export interface FacilityEquipment {
  readonly title: string;
  readonly caption: string;
  readonly href: string;
  readonly photo: FacilityPhoto;
}

/** Equipment visible in the laboratory photographs, linked to the service that uses it. */
export const FACILITY_EQUIPMENT: readonly FacilityEquipment[] = [
  {
    title: 'Leica STELLARIS 8',
    caption: 'Confocal imaging for molecular and histological work',
    href: '/services/molecular-research',
    photo: FACILITY_HERO,
  },
  {
    title: 'Confocal workstation',
    caption: 'Leica DMi8 bench used alongside the STELLARIS system',
    href: '/services/molecular-research',
    photo: {
      src: '/images/facility/confocal-workstation.jpg',
      alt: 'Wide view of the confocal imaging workstation.',
    },
  },
  {
    title: 'Multiskan SkyHigh',
    caption: 'Plate readout for absorbance and fluorescence assays',
    href: '/services/biomedical-omics-data-analysis',
    photo: {
      src: '/images/facility/plate-reader.jpg',
      alt: 'Thermo Scientific Multiskan SkyHigh microplate reader.',
    },
  },
  {
    title: 'DLAB dry bath',
    caption: 'Temperature-controlled incubation of sample tubes',
    href: '/services/molecular-research',
    photo: {
      src: '/images/facility/dry-bath.jpg',
      alt: 'DLAB dry bath holding sample tubes.',
    },
  },
  {
    title: 'Analytical balance',
    caption: 'Weighing reagents before extraction and assay setup',
    href: '/services/molecular-research',
    photo: {
      src: '/images/facility/analytical-balance.jpg',
      alt: 'Shimadzu analytical balance beside reagent bottles.',
    },
  },
  {
    title: 'Preparation bench',
    caption: 'Tube labelling, pipetting and reagent handling before sequencing',
    href: '/services/metagenomic-data-analysis',
    photo: {
      src: '/images/facility/molecular-bench.jpg',
      alt: 'Labelled tubes, pipettes and reagents on a molecular preparation bench.',
    },
  },
];
