'use client';

import { create } from 'zustand';
import { toggle, type HabitId, type HabitLog } from '@/lib/habits';

const KEY = 'habitooth.habits';

function read(): HabitLog {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HabitLog) : {};
  } catch {
    return {};
  }
}

function write(log: HabitLog) {
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
  }
}

interface HabitState {
  log: HabitLog;
  hydrated: boolean;
  hydrate: () => void;
  toggleHabit: (dateKey: string, id: HabitId) => void;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  log: {},
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ log: read(), hydrated: true });
  },

  toggleHabit: (dateKey, id) => {
    const next = toggle(get().log, dateKey, id);
    write(next);
    set({ log: next });
  },
}));
