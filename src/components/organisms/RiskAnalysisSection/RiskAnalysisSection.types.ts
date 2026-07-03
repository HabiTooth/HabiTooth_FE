import type { ToothAnalysisResult } from '@/components/organisms/OralViewer3D/ThreeScene';

export interface RiskAnalysisSectionProps {
  plaque: number;
  calculus: number;
  analysisResults?: ToothAnalysisResult[];
  calibrationMode?: boolean;
}