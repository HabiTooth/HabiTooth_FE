import { apiClient } from './client';
import type { ScanReport } from '@/types/analysis';

export const analysisApi = {
  getReport: (scanId: string) =>
    apiClient.get<ScanReport>(`/api/analysis/${scanId}`),
  getHistory: (userId: string) =>
    apiClient.get<ScanReport[]>(`/api/history/${userId}`),
};
