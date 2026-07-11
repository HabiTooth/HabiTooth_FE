import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 토큰 만료(401) 시 자동 로그아웃 - 로그인 시도 자체의 401은 제외
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      const url: string = error.config?.url ?? '';
      const hadToken = !!localStorage.getItem('accessToken');
      if (hadToken && !url.startsWith('/api/auth')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
