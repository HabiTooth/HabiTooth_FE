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

// 치아 bbox 기준 0~1. u=1 사용자 오른쪽, v=0 사진 위
export interface LesionPolygonPoint {
  u: number;
  v: number;
}

// OUTER 입술·볼 쪽, INNER 혀·입천장 쪽
export type SurfaceType = 'OUTER' | 'INNER';

export interface ToothLesion {
  toothNumber: number;
  surfaceType: SurfaceType;
  lesionType: LesionType;
  polygon: LesionPolygonPoint[];
}

export interface MeshCoordinates {
  sessionId: number;
  lesions: ToothLesion[];
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

  // 저장본 조회. 없으면 404
  getLlmReport: (sessionId: number) =>
    apiClient.get<ApiResponse<LlmReport>>(`/api/reports/scan-sessions/${sessionId}/llm-report`),

  generateLlmReport: (sessionId: number) => {
    // 이펙트 중복 실행 시 생성 요청 1회 제한
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
