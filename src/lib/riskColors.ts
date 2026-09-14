import type { LesionType, RiskLevel } from '@/lib/api/common';

/** 3D 모형·막대처럼 넓게 칠하는 곳 */
export const RISK_FILL: Record<RiskLevel, string> = {
  VERY_LOW: '#8FC7E8',
  LOW: '#8ECFB5',
  MEDIUM: '#F0CE8C',
  HIGH: '#EDA98F',
  CRITICAL: '#DE8B95',
};

/** 글자·링처럼 흰 배경에서 대비가 필요한 곳 */
export const RISK_INK: Record<RiskLevel, string> = {
  VERY_LOW: '#4A86D9',
  LOW: '#3EA184',
  MEDIUM: '#C2902F',
  HIGH: '#D07A5C',
  CRITICAL: '#C25C6C',
};

/** 리포트·3D 뷰어·홈 위험도 요약이 공유하는 5단계 라벨 */
export const RISK_LABEL_MAP: Record<RiskLevel, string> = {
  VERY_LOW: '깨끗',
  LOW: '양호',
  MEDIUM: '보통',
  HIGH: '주의',
  CRITICAL: '진단 필요',
};

export const RISK_LEGEND: Array<{ label: string; color: string }> = [
  { label: RISK_LABEL_MAP.VERY_LOW, color: RISK_FILL.VERY_LOW },
  { label: RISK_LABEL_MAP.LOW, color: RISK_FILL.LOW },
  { label: RISK_LABEL_MAP.MEDIUM, color: RISK_FILL.MEDIUM },
  { label: RISK_LABEL_MAP.HIGH, color: RISK_FILL.HIGH },
  { label: RISK_LABEL_MAP.CRITICAL, color: RISK_FILL.CRITICAL },
];

export const LESION_FILL: Record<LesionType, string> = {
  PLAQUE: '#F0CE8C',
  CALCULUS: '#E29C8B',
};
