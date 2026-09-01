'use client';

import { create } from 'zustand';
import type { AppNotification, NewNotification } from '@/lib/notifications/types';
import { showLocal } from '@/lib/notifications/browser';
import { readSettings } from '@/lib/notifications/settings';

const KEY = 'habitooth.notifications';
const MAX = 50;

function read(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function write(items: AppNotification[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // 사파리 프라이빗 모드 등에서 저장 실패해도 화면은 그대로 동작
  }
}

interface NotificationState {
  items: AppNotification[];
  hydrated: boolean;
  hydrate: () => void;
  push: (n: NewNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ items: read(), hydrated: true });
  },

  push: ({ dedupeKey, ...rest }) => {
    const settings = readSettings();
    if (!settings.push) return;
    if (rest.type === 'REPORT_READY' && !settings.report) return;

    const items = get().hydrated ? get().items : read();
    const id = dedupeKey ?? `${rest.type}:${Date.now()}`;
    if (items.some((n) => n.id === id)) return;

    const next = [
      { ...rest, id, createdAt: new Date().toISOString(), read: false },
      ...items,
    ].slice(0, MAX);

    write(next);
    set({ items: next, hydrated: true });
    showLocal(rest);
  },

  markRead: (id) => {
    const next = get().items.map((n) => (n.id === id ? { ...n, read: true } : n));
    write(next);
    set({ items: next });
  },

  markAllRead: () => {
    const next = get().items.map((n) => ({ ...n, read: true }));
    write(next);
    set({ items: next });
  },

  remove: (id) => {
    const next = get().items.filter((n) => n.id !== id);
    write(next);
    set({ items: next });
  },

  clearAll: () => {
    write([]);
    set({ items: [] });
  },
}));

export const unreadCount = (items: AppNotification[]) => items.filter((n) => !n.read).length;
