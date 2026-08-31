export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type RiskLevel = 'low' | 'normal' | 'high' | 'very-high';

export interface ReportSummaryProps {
  score: number;
  prevScore?: number;
  status: string;
  date?: string;
  reportId?: string;

  plaqueScore?: number;
  calculusScore?: number;
  plaqueRisk?: RiskLevel;
  calculusRisk?: RiskLevel;
}