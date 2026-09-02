'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraMode = 'device' | 'esp32';

const STREAM_TIMEOUT = 8000;

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
  // 스트림은 81, 제어(/led, /control)는 80
  const controlHostRef = useRef<string | null>(null);
  const streamWatchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightOn, setLightOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraMode, setCameraMode] = useState<CameraMode>('device');

  const stopCamera = useCallback(() => {
    if (streamWatchdog.current) clearTimeout(streamWatchdog.current);
    streamWatchdog.current = null;
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
          // 스트림은 :81, /led 같은 제어는 80 포트
          controlHostRef.current = esp32Url
            .replace(/^https?:\/\//, '')
            .split('/')[0]
            .split(':')[0];
          // 스트림 포트가 닫혀 있으면 onerror도 안 뜨고 TCP 타임아웃까지 멈춰 있어서 직접 끊는다
          streamWatchdog.current = setTimeout(() => {
            setError(
              `스캐너 미리보기에 연결하지 못했어요.\n${esp32Url}\n기기 전원과 WiFi 연결을 확인해 주세요.`,
            );
          }, STREAM_TIMEOUT);

          // img 엘리먼트가 마운트된 후 src 설정을 위해 requestAnimationFrame 사용
          requestAnimationFrame(() => {
            const img = imgRef.current;
            if (!img) return;
            img.onload = () => {
              if (streamWatchdog.current) clearTimeout(streamWatchdog.current);
              setIsReady(true);
              setError(null);
            };
            img.onerror = () => {
              if (streamWatchdog.current) clearTimeout(streamWatchdog.current);
              setError(`스캐너 카메라 연결 실패\n${esp32Url}`);
            };
            img.src = esp32Url;
          });
        } else {
          setCameraMode('device');
          // getUserMedia는 HTTPS나 localhost에서만 쓸 수 있다.
          // 폰에서 http://192.168.x.x 로 붙으면 mediaDevices 자체가 없어 권한 창도 안 뜬다.
          if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            setError(
              '휴대폰에서는 HTTPS로 접속해야 카메라를 쓸 수 있어요.\nnpm run dev:https 로 실행한 뒤 https:// 주소로 접속해 주세요.',
            );
            return;
          }
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
      } catch (e) {
        const name = e instanceof DOMException ? e.name : '';
        if (name === 'NotAllowedError') {
          setError('카메라 접근이 거부됐어요.\n브라우저 설정에서 카메라 권한을 허용해 주세요.');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setError('쓸 수 있는 카메라를 찾지 못했어요.');
        } else if (name === 'NotReadableError') {
          setError('카메라를 다른 앱이 쓰고 있어요.\n해당 앱을 끄고 다시 시도해 주세요.');
        } else {
          setError('카메라를 열지 못했어요.\n다시 시도해 주세요.');
        }
      }
    },
    [facingMode, stopCamera],
  );

  const toggleLight = useCallback(async () => {
    if (cameraMode === 'esp32') {
      const next = !lightOn;
      const host = controlHostRef.current;
      if (host) {
        fetch(`http://${host}/led?mode=${next ? 'white' : 'off'}`, { mode: 'no-cors' }).catch(
          () => {},
        );
      }
      setLightOn(next);
      return;
    }
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
