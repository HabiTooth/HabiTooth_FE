import { useState } from 'react';
import type { ScanReport } from '@/types/analysis';

// analysisApi.getReport 연동 + 에러 처리 - 추후 구현 예정
export function useOralReport() {
  const [report, setReport] = useState<ScanReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = (_: string) => {
    setIsLoading(false);
    setReport(null);
  };

  return { report, isLoading, fetchReport };
}
