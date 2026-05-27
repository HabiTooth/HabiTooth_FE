import { create } from 'zustand';
import type { ScanReport } from '@/types/analysis';

interface ScanStore {
  currentReport: ScanReport | null;
  history: ScanReport[];
  isLoading: boolean;
  setCurrentReport: (report: ScanReport | null) => void;
  setHistory: (history: ScanReport[]) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  currentReport: null,
  history: [],
  isLoading: false,
  setCurrentReport: (report) => set({ currentReport: report }),
  setHistory: (history) => set({ history }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
