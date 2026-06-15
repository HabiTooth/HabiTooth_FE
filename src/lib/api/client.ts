import axios from 'axios';

const API_URL = 'http://10.49.238.65:8080';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
