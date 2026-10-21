import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { LesionType, RiskLevel } from './common';

// 기록 없으면 전 필드 null
export interface DashboardScore {
  sessionId: number | null;
  score: number | null;
  scoreDiff: number | null;
  scannedAt: string | null;
}

export interface DashboardReport {
  sessionId: number | null;
  scannedAt: string | null;
  averageScore: number;
  plaqueRiskLevel: RiskLevel | null;
  calculusRiskLevel: RiskLevel | null;
}

export interface DashboardRisk {
  sessionId: number;
  // 완료된 세션 없으면 빈 배열. 한 광원만 찍었으면 그 항목만
  categories: Array<{
    lesionType: LesionType;
    riskLevel: RiskLevel;
    score: number;
    affectedTeeth?: number;
    detectedTeeth?: number;
    affectedRatio?: number;
  }>;
}

export const dashboardApi = {
  getScore: () => apiClient.get<ApiResponse<DashboardScore>>('/api/dashboard/score'),
  getReport: () => apiClient.get<ApiResponse<DashboardReport>>('/api/dashboard/report'),
  getRisk: () => apiClient.get<ApiResponse<DashboardRisk>>('/api/dashboard/risk'),
};
