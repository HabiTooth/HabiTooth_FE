import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export type LightType = 'WHITE_LIGHT' | 'UV_LIGHT';
export type { ViewType } from './scan';
import type { ViewType } from './scan';

export interface ToothAreaResult {
  toothNumber: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  plaqueRatio: number;
  calculusRatio: number;
}

export interface DetectedIssueResult {
  lesionType: 'PLAQUE' | 'CALCULUS';
  confidence: number;
  bbox: number[];
}

export interface AiAnalyzeResult {
  scanImageId: number;
  taskId: string;
  viewType: ViewType;
  status: string;
  teeth: ToothAreaResult[];
  issues: DetectedIssueResult[];
  totalScore: number;
  recommendation: string;
}

export const aiApi = {
  analyze: (scanImageId: number, viewType: ViewType, lightType: LightType) =>
    apiClient.post<ApiResponse<AiAnalyzeResult>>('/api/ai/analyze', {
      scanImageId,
      viewType,
      lightType,
    }),
};
