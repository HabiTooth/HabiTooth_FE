import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { LesionType, RiskLevel } from './common';

export interface DashboardScore {
  sessionId: number;
  score: number;
  scoreDiff: number | null;
  scannedAt: string;
}

export interface DashboardReport {
  sessionId: number;
  scannedAt: string;
  averageScore: number;
  plaqueRiskLevel: RiskLevel;
  calculusRiskLevel: RiskLevel;
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
