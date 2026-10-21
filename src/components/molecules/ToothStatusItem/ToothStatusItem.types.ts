import type { RiskLevel as ApiRiskLevel } from '@/lib/api/common';

// 요약 4단계. 리포트 문구·색 매핑용
export type RiskLevel = 'low' | 'normal' | 'high' | 'very-high';

export interface LesionScore {
  riskLevel: ApiRiskLevel;
  score: number | null;
  affectedTeeth?: number | null;
  detectedTeeth?: number | null;
}

export interface ToothStatusItemProps {
  label: string;
  // null이면 미측정
  value: LesionScore | null;
}
