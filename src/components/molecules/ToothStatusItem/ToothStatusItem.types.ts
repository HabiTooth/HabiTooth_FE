import type { RiskLevel } from '@/lib/api/common';

export type { RiskLevel };

export interface ToothStatusItemProps {
  label: string;
  score: number;
  riskLevel: RiskLevel;
}