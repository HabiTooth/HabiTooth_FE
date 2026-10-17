import type { ViewType } from '@/lib/api/scan';

export interface RiskAnalysisSectionProps {
  plaque: number;
  calculus: number;
  capturedZones?: ViewType[];
}
