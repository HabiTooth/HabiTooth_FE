'use client';

import { create } from 'zustand';

function decodeEmail(token: string): string | null {
  try {
    return (JSON.parse(atob(token.split('.')[1])) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  email: string | null;
  deviceId: number | null;
  deviceIp: string | null;
  setToken: (token: string) => void;
  setDevice: (deviceId: number, deviceIp: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  email: typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null,
  deviceId: typeof window !== 'undefined' ? Number(localStorage.getItem('deviceId')) || null : null,
  deviceIp: typeof window !== 'undefined' ? localStorage.getItem('deviceIp') : null,
  setToken: (token) => {
    const email = decodeEmail(token);
    localStorage.setItem('accessToken', token);
    if (email) localStorage.setItem('userEmail', email);
    set({ token, email });
  },
  setDevice: (deviceId, deviceIp) => {
    localStorage.setItem('deviceId', String(deviceId));
    localStorage.setItem('deviceIp', deviceIp);
    set({ deviceId, deviceIp });
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('deviceId');
    localStorage.removeItem('deviceIp');
    set({ token: null, email: null, deviceId: null, deviceIp: null });
  },
}));
