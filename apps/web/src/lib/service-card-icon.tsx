import { ChartNoAxesCombined, Database, Dna, FileText, Microscope } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  microscope: Microscope,
  dna: Dna,
  database: Database,
  chart: ChartNoAxesCombined,
  fileText: FileText,
};

export function serviceCardIcon(iconKey: string | undefined): LucideIcon | undefined {
  if (iconKey === undefined || iconKey.length === 0) return undefined;
  return ICONS[iconKey];
}
