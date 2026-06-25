import { useState } from 'react';

// WebRTC 시그널링 + 피어 연결 - 추후 구현 예정
export function useWebRTC() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 피어 연결 후 미디어 스트림 가져오는 부분
  const connect = () => {
    setIsConnected(false);
    setStream(null);
  };

  // 피어 연결 종료 + 스트림 해제
  const disconnect = () => {
    setIsConnected(false);
    setStream(null);
  };

  return { stream, isConnected, connect, disconnect };
}
