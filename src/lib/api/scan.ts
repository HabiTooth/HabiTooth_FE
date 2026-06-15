import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export type ScanImageType = 'WHITE_LIGHT' | 'UV_LIGHT';
export type ScanRegion = 'UPPER' | 'LOWER' | 'FRONT' | 'LEFT' | 'RIGHT' | 'FULL';
export type ViewType =
  | 'UPPER_LEFT' | 'UPPER_CENTER' | 'UPPER_RIGHT'
  | 'LOWER_LEFT' | 'LOWER_CENTER' | 'LOWER_RIGHT'
  | 'OUTER_LEFT' | 'OUTER_CENTER' | 'OUTER_RIGHT';

export interface ScanUploadResult {
  sessionId: number;
  imageId: number;
  imageType: ScanImageType;
  region: ScanRegion;
  imageUrl: string;
}

export interface ScanSessionCreateRequest {
  userId: number;
  deviceId: number;
}

export interface ScanSessionResponse {
  sessionId: number;
  userId: number;
  deviceId: number;
  status: string;
  createdAt: string;
}

export interface AnalysisResultSummary {
  sessionId: number;
  analysisResultSummaries: Array<{
    analysisResultId: number;
    score: number;
    viewType: ViewType;
  }>;
  averageScore: number;
}

export const scanApi = {
  // 개발용 API (기존)
  uploadImage: (params: {
    userId: number;
    deviceId: number;
    imageType: ScanImageType;
    region: ScanRegion;
    file: File;
  }) => {
    const formData = new FormData();
    formData.append('file', params.file);
    return apiClient.post<ApiResponse<ScanUploadResult>>(
      `/api/scan/upload?userId=${params.userId}&deviceId=${params.deviceId}&imageType=${params.imageType}&region=${params.region}`,
      formData,
    );
  },

  // 세션 기반 API
  createSession: (params: ScanSessionCreateRequest) =>
    apiClient.post<ApiResponse<number>>('/api/scan-sessions', params),

  uploadImageToSession: (sessionId: number, params: { file: File; viewType: ViewType; lightType: 'WHITE_LIGHT' | 'UV_LIGHT' }) => {
    const formData = new FormData();
    formData.append('file', params.file);
    const metadataJson = JSON.stringify({
      viewType: params.viewType,
      lightType: params.lightType,
    });
    const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
    formData.append('metadata', metadataBlob);
    return apiClient.post<ApiResponse<{ imageId: number; imageUrl: string }>>(
      `/api/scan-sessions/${sessionId}/images`,
      formData,
    );
  },

  analyzeSession: (sessionId: number) =>
    apiClient.post<ApiResponse<AnalysisResultSummary>>(`/api/scan-sessions/${sessionId}/analyze`, {}),

  getReport: (sessionId: number) =>
    apiClient.get<ApiResponse<{ teethData: any; analysisResults: any }>>(`/api/scan-sessions/${sessionId}/report`),
};
