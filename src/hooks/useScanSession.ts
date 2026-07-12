import { useState } from 'react';

// 스캔 세션 라이프사이클 (카운트다운, 촬영, 업로드) - 추후 구현 예정
export function useScanSession() {
  const [isScanning, setIsScanning] = useState(false);

  // 세션 초기화 + 프레임 캡처 시작
  const startScan = () => {
    setIsScanning(true);
  };

  // 세션 종료 + 분석 트리거
  const stopScan = () => {
    setIsScanning(false);
  };

  return { isScanning, startScan, stopScan };
}
