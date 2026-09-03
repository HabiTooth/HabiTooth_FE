import type { AxiosResponse } from 'axios';
import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { LesionType, RiskLevel } from './common';
import type { ViewType } from './scan';

export interface PolygonPoint {
  x: number;
  y: number;
}

export interface SessionReport {
  sessionId: number;
  totalScore: number;
  summary: {
    totalPlaqueRatio: number;
    totalCalculusRatio: number;
  };
  toothStatuses: Array<{
    toothNumber: number;
    lesionType: LesionType | null;
    areaRatio: number;
    riskLevel: RiskLevel;
  }>;
}

export interface MeshCoordinates {
  sessionId: number;
  meshData: Array<{
    viewType: string;
    issues: Array<{
      lesionType: LesionType;
      polygon: PolygonPoint[];
    }>;
  }>;
}

export interface SingleImageReport {
  analysisResultId: number;
  scanImageId: number;
  taskId: string;
  analysisStatus: 'SUCCESS' | 'FAILED';
  viewType: ViewType;
  totalScore: number;
  recommendation: string;
  teeth: Array<{
    areaId: number;
    toothNumber: number;
    templateRegionId: string | null;
    jawType: string;
    surfaceType: string;
    viewType: ViewType;
    lesionType: LesionType | null;
    areaRatio: number | null;
    toothScore: number | null;
    riskLevel: RiskLevel;
  }>;
  issues: Array<{
    toothNumber: number;
    templateRegionId: string | null;
    lesionType: LesionType;
    confidence: number;
    riskLevel: RiskLevel;
    polygon: PolygonPoint[];
  }>;
  createdAt: string;
}

export interface LlmReport {
  sessionId: number;
  riskDetail: Array<{
    title: string;
    detail: string;
    riskLevel: RiskLevel;
  }>;
  management: Array<{
    title: string;
    detail: string;
  }>;
  disclaimer: string;
}

const generating = new Map<number, Promise<AxiosResponse<ApiResponse<LlmReport>>>>();

export const reportApi = {
  getSessionReport: (sessionId: number) =>
    apiClient.get<ApiResponse<SessionReport>>(`/api/reports/scan-sessions/${sessionId}/simple`),

  getMeshCoordinates: (sessionId: number) =>
    apiClient.get<ApiResponse<MeshCoordinates>>(`/api/reports/scan-sessions/${sessionId}/3d`),

  getSingleImageReport: (scanImageId: number) =>
    apiClient.get<ApiResponse<SingleImageReport>>(`/api/reports/scan-images/${scanImageId}`),

  // 저장된 리포트 조회. LLM을 안 부르니까 빠르고, 없으면 404
  getLlmReport: (sessionId: number) =>
    apiClient.get<ApiResponse<LlmReport>>(`/api/reports/scan-sessions/${sessionId}/llm-report`),

  // LLM 응답이 수 분 걸려서 공용 타임아웃(30초)으로는 항상 끊김
  generateLlmReport: (sessionId: number) => {
    // 이펙트가 두 번 돌 때 3분짜리 생성이 두 번 나가지 않게
    const running = generating.get(sessionId);
    if (running) return running;

    const req = apiClient
      .post<ApiResponse<LlmReport>>(
        `/api/reports/scan-sessions/${sessionId}/llm-report`,
        null,
        { timeout: 300_000 },
      )
      .finally(() => generating.delete(sessionId));

    generating.set(sessionId, req);
    return req;
  },
};
