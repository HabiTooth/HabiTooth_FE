'use client';

import { create } from 'zustand';
import { normalizeMissing, setGroup, toggleTooth } from '@/lib/dentition';

const KEY = 'habitooth.dentition';
const DONE_KEY = 'habitooth.dentition.set';

function read(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeMissing(JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function write(missing: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(missing));
    localStorage.setItem(DONE_KEY, 'true');
  } catch {
    // 저장이 막혀도 이번 세션 판정은 그대로
  }
}

interface DentitionState {
  missing: number[];
  hydrated: boolean;
  answered: boolean;
  hydrate: () => void;
  toggle: (tooth: number) => void;
  setPreset: (group: number[], on: boolean) => void;
  save: () => void;
  reset: () => void;
}

export const useDentitionStore = create<DentitionState>((set, get) => ({
  missing: [],
  hydrated: false,
  answered: false,

  hydrate: () => {
    if (get().hydrated) return;
    const answered =
      typeof window !== 'undefined' && localStorage.getItem(DONE_KEY) === 'true';
    set({ missing: read(), hydrated: true, answered });
  },

  toggle: (tooth) => set({ missing: toggleTooth(get().missing, tooth) }),

  setPreset: (group, on) => set({ missing: setGroup(get().missing, group, on) }),

  save: () => {
    write(get().missing);
    set({ answered: true });
  },

  reset: () => set({ missing: [] }),
}));
