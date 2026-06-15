import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  birthDate?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
}

export const authApi = {
  signUp: (payload: SignUpPayload) =>
    apiClient.post<ApiResponse<string>>('/api/auth/signup', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<LoginResult>>('/api/auth/login', payload),
};
