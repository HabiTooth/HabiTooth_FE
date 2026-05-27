import { useState } from 'react';
import type { ScanReport } from '@/types/analysis';

// TODO: implement report fetching with error handling and caching
export function useOralReport() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: call analysisApi.getReport and update state
  const fetchReport = (_: string) => {
    setIsLoading(false);
    setReport(null);
  };

  return { report, isLoading, fetchReport };
}
