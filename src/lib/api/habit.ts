import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { HabitId } from '@/lib/habits';

export interface HabitDayLog {
  date: string;
  habits: HabitId[];
}

export const habitApi = {
  // from~to 양 끝 포함, 최대 366일. 습관이 없는 날짜는 응답에서 빠진다
  getHabits: (from: string, to: string) =>
    apiClient.get<ApiResponse<{ logs: HabitDayLog[] }>>('/api/habits', { params: { from, to } }),

  // 토글이 아니라 그 날짜 목록을 통째로 덮어쓴다
  updateHabits: (date: string, habits: HabitId[]) =>
    apiClient.put<ApiResponse<HabitDayLog>>(`/api/habits/${date}`, { habits }),
};
