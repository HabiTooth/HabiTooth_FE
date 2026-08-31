import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { RiskLevel } from './common';

export type HistoryPeriodFilter = 'ALL' | 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS';
export type HistoryScoreFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface HistoryToday {
  date: string;
  time: string;
  score: number;
  riskLevel: RiskLevel;
  scoreDiff: number | null;
}

export interface HistoryScoreTrendItem {
  date: string;
  score: number;
}

export interface HistoryRecordItem {
  date: string;
  time: string;
  score: number;
  riskLevel: RiskLevel;
}

export interface HistoryListItem {
  date: string;
  score: number;
  plaqueRiskLevel: RiskLevel;
  calculusRiskLevel: RiskLevel;
}

export interface HistoryList {
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
  items: HistoryListItem[];
}

export const historyApi = {
  // 기록 없으면 result가 null
  getToday: () => apiClient.get<ApiResponse<HistoryToday | null>>('/api/history/today'),

  getScoreTrend: () =>
    apiClient.get<ApiResponse<HistoryScoreTrendItem[]>>('/api/history/graph'),

  getRecords: () => apiClient.get<ApiResponse<HistoryRecordItem[]>>('/api/history/compare'),

  getList: (params?: {
    period?: HistoryPeriodFilter;
    scoreFilter?: HistoryScoreFilter;
    page?: number;
    size?: number;
  }) => apiClient.get<ApiResponse<HistoryList>>('/api/history/list', { params }),
};
