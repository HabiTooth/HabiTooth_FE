'use client';

import { create } from 'zustand';
import type { AppNotification, NewNotification } from '@/lib/notifications/types';
import { showLocal } from '@/lib/notifications/browser';
import { readSettings } from '@/lib/notifications/settings';

const KEY = 'habitooth.notifications';
// 지운 알림이 다시 생기지 않게 발생 이력을 따로 남김
const SEEN_KEY = 'habitooth.notifications.seen';

const MAX_ITEMS = 50;
const MAX_SEEN = 300;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

const readItems = () => readJson<AppNotification[]>(KEY, []);
const readSeen = () => readJson<string[]>(SEEN_KEY, []);

interface NotificationState {
  items: AppNotification[];
  hydrated: boolean;
  hydrate: () => void;
  current: () => AppNotification[];
  push: (n: NewNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  reset: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ items: readItems(), hydrated: true });
  },

  current: () => (get().hydrated ? get().items : readItems()),

  push: ({ dedupeKey, ...rest }) => {
    const settings = readSettings();
    if (!settings.push) return;
    if (rest.type === 'REPORT_READY' && !settings.report) return;

    const id = dedupeKey ?? `${rest.type}:${Date.now()}`;

    const seen = readSeen();
    if (seen.includes(id)) return;
    writeJson(SEEN_KEY, [id, ...seen].slice(0, MAX_SEEN));

    const items = get().current();
    const next = [
      { ...rest, id, createdAt: new Date().toISOString(), read: false },
      ...items,
    ].slice(0, MAX_ITEMS);

    writeJson(KEY, next);
    set({ items: next, hydrated: true });
    showLocal(rest);
  },

  markRead: (id) => {
    const next = get().current().map((n) => (n.id === id ? { ...n, read: true } : n));
    writeJson(KEY, next);
    set({ items: next, hydrated: true });
  },

  markAllRead: () => {
    const next = get().current().map((n) => ({ ...n, read: true }));
    writeJson(KEY, next);
    set({ items: next, hydrated: true });
  },

  remove: (id) => {
    const next = get().current().filter((n) => n.id !== id);
    writeJson(KEY, next);
    set({ items: next, hydrated: true });
  },

  clearAll: () => {
    writeJson(KEY, []);
    set({ items: [] });
  },

  reset: () => {
    writeJson(KEY, []);
    writeJson(SEEN_KEY, []);
    set({ items: [] });
  },

  clear: () => set({ items: [], hydrated: false }),
}));

export const unreadCount = (items: AppNotification[]) => items.filter((n) => !n.read).length;
