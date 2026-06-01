export interface AnalysisResultProps {
  date: string;
  time: string;
  score: number;
  plaqueRisk: 'low' | 'normal' | 'high' | 'very-high';
  calculusRisk: 'low' | 'normal' | 'high' | 'very-high';
}