export interface RiskSummaryProps {
  plaqueScore: number;
  calculusScore: number;
  gumScore: number;
  plaqueRisk: 'low' | 'normal' | 'high' | 'very-high';
  calculusRisk: 'low' | 'normal' | 'high' | 'very-high';
  gumRisk: 'low' | 'normal' | 'high' | 'very-high';
}