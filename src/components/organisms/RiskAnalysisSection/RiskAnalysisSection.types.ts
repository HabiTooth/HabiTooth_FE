export interface RiskItem {
  label: string;
  percentage: number;
  color: 'warning' | 'danger' | 'good';
}

export interface RiskAnalysisSectionProps {
  plaque: number;    // 치태 %
  calculus: number;  // 치석 %
}