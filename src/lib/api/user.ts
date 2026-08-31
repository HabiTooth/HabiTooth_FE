import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { DeviceStatusResponse } from './device';

export interface Profile {
  userId: number;
  email: string;
  name: string;
  birthDate: string | null;
}

export interface ProfileUpdatePayload {
  name: string;
  birthDate?: string;
}

export interface NotificationSetting {
  pushNotificationEnabled: boolean;
  reportNotificationEnabled: boolean;
}

export const userApi = {
  getProfile: () => apiClient.get<ApiResponse<Profile>>('/api/user/profile'),

  updateProfile: (payload: ProfileUpdatePayload) =>
    apiClient.patch<ApiResponse<Profile>>('/api/user/profile', payload),

  getDeviceStatus: () =>
    apiClient.get<ApiResponse<DeviceStatusResponse[]>>('/api/user/status'),

  getNotification: () =>
    apiClient.get<ApiResponse<NotificationSetting>>('/api/user/notification'),

  updateNotification: (payload: NotificationSetting) =>
    apiClient.patch<ApiResponse<NotificationSetting>>('/api/user/notification', payload),

  deleteData: () => apiClient.delete<ApiResponse<null>>('/api/user/data'),
};
