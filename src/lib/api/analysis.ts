import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface SessionReportResponse {
  sessionId: number;
  averageScore: number;
  toothSummaries: Array<{
    toothNumber: number;
    riskLevel: 'NORMAL' | 'CAUTION' | 'DANGER';
    lesionType: 'PLAQUE' | 'CALCULUS' | null;
    confidence: number;
  }>;
}

export interface SingleImageReportResponse {
  viewType: string;
  totalScore: number;
  recommendation: string;
  teeth: Array<{
    areaId: number;
    toothNumber: number;
    jawType: string;
    surfaceType: string;
    polygon: Array<{ x: number; y: number }>;
  }>;
  issues: Array<{
    toothNumber: number;
    lesionType: 'PLAQUE' | 'CALCULUS';
    confidence: number;
    riskLevel: 'NORMAL' | 'CAUTION' | 'DANGER';
    polygon: Array<{ x: number; y: number }>;
  }>;
}

export const analysisApi = {
  getSessionReport: (sessionId: number) =>
    apiClient.get<ApiResponse<SessionReportResponse>>(`/api/scan-sessions/${sessionId}/report`),

  getSingleImageReport: (scanImageId: number) =>
    apiClient.get<ApiResponse<SingleImageReportResponse>>(`/api/reports/scan-images/${scanImageId}`),
};
