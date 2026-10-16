import type { LesionType, RiskLevel } from '@/lib/api/common';
import type { RiskLevel as SummaryRiskLevel } from '@/components/molecules/ToothStatusItem/ToothStatusItem.types';

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

const TO_SUMMARY: Record<SummaryRiskLevel, RiskLevel> = {
  low: 'LOW',
  normal: 'MEDIUM',
  high: 'HIGH',
  'very-high': 'CRITICAL',
};

export const summaryFill = (level: SummaryRiskLevel) => RISK_FILL[TO_SUMMARY[level]];
export const summaryInk = (level: SummaryRiskLevel) => RISK_INK[TO_SUMMARY[level]];

export const RISK_LEGEND: Array<{ label: string; color: string }> = [
  { label: '낮음', color: RISK_FILL.LOW },
  { label: '보통', color: RISK_FILL.MEDIUM },
  { label: '높음', color: RISK_FILL.HIGH },
  { label: '매우 높음', color: RISK_FILL.CRITICAL },
];

/** 3D 모형의 치아 색. 분홍 잇몸 위에서 구분되도록 카드용 파스텔보다 진하다 */
export const RISK_MODEL_FILL: Record<RiskLevel, string> = {
  VERY_LOW: '#7EC8F7',
  LOW: '#4FCB94',
  MEDIUM: '#F7B21B',
  HIGH: '#F26A24',
  CRITICAL: '#E42F49',
};

// 3D 모형 위 병변 마커. 팔레트가 바뀌어도 고정
export const MARKER_FILL: Record<LesionType, string> = {
  PLAQUE: '#F5B63A',
  CALCULUS: '#E8575A',
};

export const LESION_FILL: Record<LesionType, string> = {
  PLAQUE: '#F0CE8C',
  CALCULUS: '#E29C8B',
};
