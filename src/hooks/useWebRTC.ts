import { useState } from 'react';

// TODO: implement WebRTC signaling and peer connection
export function useWebRTC() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // TODO: establish WebRTC peer connection and get media stream
  const connect = () => {
    setIsConnected(false);
    setStream(null);
  };

  // TODO: close peer connection and release media stream
  const disconnect = () => {
    setIsConnected(false);
    setStream(null);
  };

  return { stream, isConnected, connect, disconnect };
}
