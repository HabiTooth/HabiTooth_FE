import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface DeviceRegisterRequest {
  deviceName: string;
  macAddress?: string;
  ip?: string;
}

export interface DeviceResponse {
  deviceId: number;
  userId: number;
  deviceName: string;
  macAddress: string;
  ip: string;
  status: string;
  createdAt: string;
}

export const deviceApi = {
  register: (params: DeviceRegisterRequest) =>
    apiClient.post<ApiResponse<DeviceResponse>>('/api/device', params),

  getStatus: () =>
    apiClient.get<ApiResponse<DeviceResponse[]>>('/api/device/status'),
};
