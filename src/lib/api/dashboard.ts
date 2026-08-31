import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { LesionType, RiskLevel } from './common';

// 스캔 기록이 없으면 BE가 전 필드 null인 빈 객체를 준다
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
  categories: Array<{
    lesionType: LesionType;
    riskLevel: RiskLevel;
    affectedRatio: number;
  }>;
}

export const dashboardApi = {
  getScore: () => apiClient.get<ApiResponse<DashboardScore>>('/api/dashboard/score'),
  getReport: () => apiClient.get<ApiResponse<DashboardReport>>('/api/dashboard/report'),
  getRisk: () => apiClient.get<ApiResponse<DashboardRisk>>('/api/dashboard/risk'),
};
