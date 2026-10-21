import type { RiskLevel as ApiRiskLevel } from '@/lib/api/common';
import type { LesionScore } from '@/components/molecules/ToothStatusItem/ToothStatusItem.types';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type RiskLevel = 'low' | 'normal' | 'high' | 'very-high';

export interface ReportSummaryProps {
  score: number;
  prevScore?: number;
  status: string;
  date?: string;
  reportId?: string;

  // undefined면 섹션 숨김, null이면 미측정
  plaque?: LesionScore | null;
  calculus?: LesionScore | null;
  plaqueRisk?: RiskLevel;
  calculusRisk?: RiskLevel;

  teeth?: ApiRiskLevel[];
  totalTeeth?: number;
}
