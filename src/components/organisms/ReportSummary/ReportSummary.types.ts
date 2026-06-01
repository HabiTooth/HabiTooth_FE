export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ReportSummaryProps {
  score: number;
  prevScore?: number;
  grade: Grade;
  status: string;
}