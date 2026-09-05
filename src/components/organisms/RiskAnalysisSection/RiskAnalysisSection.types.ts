import type { ToothAnalysisResult } from '@/components/organisms/OralViewer3D/ThreeScene';
import type { ViewType } from '@/lib/api/scan';

export interface RiskAnalysisSectionProps {
  plaque: number;
  calculus: number;
  analysisResults?: ToothAnalysisResult[];
  scannedTeeth?: number[];
  capturedZones?: ViewType[];
  calibrationMode?: boolean;
}