import axios from 'axios';
import { readToken, clearStoredAuth } from '@/lib/tokenStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  // 이 헤더가 없으면 ngrok 무료 플랜이 브라우저 GET 요청을 경고 HTML로 가로챈다.
  // 그 응답에는 CORS 헤더가 없어서 브라우저가 막고, axios는 Network Error로 보고한다.
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

apiClient.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 토큰 만료(401) 시 자동 로그아웃 - 로그인 시도 자체의 401은 제외
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      const url: string = error.config?.url ?? '';
      if (readToken() && !url.startsWith('/api/auth')) {
        clearStoredAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
