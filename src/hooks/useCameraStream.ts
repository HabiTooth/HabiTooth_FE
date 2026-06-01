'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export interface UseCameraStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  error: string | null;
  lightOn: boolean;
  facingMode: 'user' | 'environment';
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  toggleLight: () => Promise<void>;
  flipCamera: () => Promise<void>;
  captureFrame: () => string | null;
}

export function useCameraStream(): UseCameraStreamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightOn, setLightOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsReady(false);
    setLightOn(false);
  }, []);

  const startCamera = useCallback(async (facing?: 'user' | 'environment') => {
    const mode = facing ?? facingMode;
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(() => {});
          setIsReady(true);
        };
      }
      setError(null);
    } catch {
      setError('카메라 접근 권한이 필요합니다.\n설정에서 카메라 권한을 허용해 주세요.');
    }
  }, [facingMode, stopCamera]);

  const toggleLight = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !lightOn;
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setLightOn(next);
    } catch {
      // torch not supported on this device
    }
  }, [lightOn]);

  const flipCamera = useCallback(async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera(next);
  }, [facingMode, startCamera]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !isReady || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [isReady]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return { videoRef, isReady, error, lightOn, facingMode, startCamera, stopCamera, toggleLight, flipCamera, captureFrame };
}
