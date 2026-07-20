'use client';

import { useState, useCallback, useRef } from 'react';

export type BluetoothStatus = 'idle' | 'requesting' | 'connecting' | 'connected' | 'error';

export interface UseBluetoothDeviceReturn {
  status: BluetoothStatus;
  deviceName: string | null;
  error: string | null;
  requestAndConnect: () => Promise<void>;
  disconnect: () => void;
}

export function useBluetoothDevice(): UseBluetoothDeviceReturn {
  const [status, setStatus] = useState<BluetoothStatus>('idle');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<BluetoothDevice | null>(null);

  const requestAndConnect = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      setError('이 브라우저는 블루투스를 지원하지 않아요.\nChrome 또는 Edge를 사용해 주세요.');
      setStatus('error');
      return;
    }

    try {
      setStatus('requesting');
      setError(null);

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'HabiTooth' }],
      });

      deviceRef.current = device;
      setDeviceName(device.name ?? '알 수 없는 기기');
      setStatus('connecting');

      if (!device.gatt) throw new Error('GATT not supported');
      await device.gatt.connect();

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('idle');
        setDeviceName(null);
      });

      setStatus('connected');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        setStatus('idle');
      } else {
        setError('연결에 실패했어요.\n기기가 근처에 있는지 확인해 주세요.');
        setStatus('error');
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    deviceRef.current?.gatt?.disconnect();
    deviceRef.current = null;
    setStatus('idle');
    setDeviceName(null);
  }, []);

  return { status, deviceName, error, requestAndConnect, disconnect };
}
