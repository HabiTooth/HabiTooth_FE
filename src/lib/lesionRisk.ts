import type { LesionType, RiskLevel } from '@/lib/api/common';

export const RISK_ORDER: RiskLevel[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const LESIONS: LesionType[] = ['PLAQUE', 'CALCULUS'];

export const LESION_LABEL: Record<LesionType, string> = {
  PLAQUE: '치태',
  CALCULUS: '치석',
};

export interface LesionRisk {
  lesionType: LesionType;
  riskLevel: RiskLevel;
}

// 한 치아에 병변 종류별 행이 따로 오니까 종류별 최악만 남김
export function worstByLesion(
  teeth: Array<{ lesionType: LesionType | null; riskLevel: RiskLevel }>,
): LesionRisk[] {
  return LESIONS.map((lesionType) => {
    const ranks = teeth
      .filter((t) => t.lesionType === lesionType)
      .map((t) => RISK_ORDER.indexOf(t.riskLevel));
    return { lesionType, riskLevel: RISK_ORDER[ranks.length > 0 ? Math.max(...ranks) : 0] };
  });
}
