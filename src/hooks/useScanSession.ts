import { useState } from 'react';

// TODO: implement scan session lifecycle (countdown, capture, upload)
export function useScanSession() {
  const [isScanning, setIsScanning] = useState(false);

  // TODO: initialize session and begin frame capture
  const startScan = () => {
    setIsScanning(true);
  };

  // TODO: finalize session and trigger analysis
  const stopScan = () => {
    setIsScanning(false);
  };

  return { isScanning, startScan, stopScan };
}
