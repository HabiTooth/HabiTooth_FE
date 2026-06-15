'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraMode = 'device' | 'esp32';

export interface UseCameraStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  isReady: boolean;
  error: string | null;
  lightOn: boolean;
  facingMode: 'user' | 'environment';
  cameraMode: CameraMode;
  startCamera: (mode?: CameraMode, esp32Url?: string) => Promise<void>;
  stopCamera: () => void;
  toggleLight: () => Promise<void>;
  flipCamera: () => Promise<void>;
  captureFrame: () => string | null;
}

export function useCameraStream(): UseCameraStreamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightOn, setLightOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraMode, setCameraMode] = useState<CameraMode>('device');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (imgRef.current) imgRef.current.src = '';
    setIsReady(false);
    setLightOn(false);
  }, []);

  const startCamera = useCallback(
    async (mode: CameraMode = 'device', esp32Url?: string) => {
      try {
        stopCamera();

        if (mode === 'esp32' && esp32Url) {
          setCameraMode('esp32');
          // img 엘리먼트가 마운트된 후 src 설정을 위해 requestAnimationFrame 사용
          requestAnimationFrame(() => {
            const img = imgRef.current;
            if (!img) return;
            img.onload = () => { setIsReady(true); setError(null); };
            img.onerror = () => { setError(`ESP32 카메라 연결 실패\n${esp32Url}`); };
            img.src = esp32Url;
          });
        } else {
          setCameraMode('device');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
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
        }
      } catch {
        setError('카메라 접근 권한이 필요합니다.\n설정에서 카메라 권한을 허용해 주세요.');
      }
    },
    [facingMode, stopCamera],
  );

  const toggleLight = useCallback(async () => {
    if (cameraMode === 'esp32') { setLightOn((prev) => !prev); return; }
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !lightOn;
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setLightOn(next);
    } catch {
      // torch not supported
    }
  }, [lightOn, cameraMode]);

  const flipCamera = useCallback(async () => {
    if (cameraMode === 'esp32') return;
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    await startCamera('device');
  }, [facingMode, startCamera, cameraMode]);

  const captureFrame = useCallback((): string | null => {
    if (cameraMode === 'esp32') {
      const img = imgRef.current;
      if (!img || !isReady) return null;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      try {
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.85);
      } catch {
        return null;
      }
    }
    const video = videoRef.current;
    if (!video || !isReady || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [isReady, cameraMode]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return {
    videoRef,
    imgRef,
    isReady,
    error,
    lightOn,
    facingMode,
    cameraMode,
    startCamera,
    stopCamera,
    toggleLight,
    flipCamera,
    captureFrame,
  };
}
