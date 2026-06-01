'use client';

import { useRef, useEffect, useState } from 'react';
import type { ScanStatusType } from '@/components/molecules/ScanStatusBanner';

interface Options {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
}

const SHAKE_THRESHOLD = 18;     // m/s² — 이 이상이면 흔들림으로 판정
const DARK_THRESHOLD = 45;      // 0-255 평균 밝기 — 이 이하면 어두움으로 판정
const SHAKE_COOLDOWN_MS = 1500;

export function useScanDetection({ videoRef, enabled }: Options) {
  const [detectedStatus, setDetectedStatus] = useState<ScanStatusType>('good');
  const isShakingRef = useRef(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 흔들림 감지 (DeviceMotionEvent) ─────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const onMotion = (e: DeviceMotionEvent) => {
      const g = e.accelerationIncludingGravity;
      if (!g) return;
      const mag = Math.sqrt((g.x ?? 0) ** 2 + (g.y ?? 0) ** 2 + (g.z ?? 0) ** 2);

      if (mag > SHAKE_THRESHOLD) {
        isShakingRef.current = true;
        setDetectedStatus('shaking');
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => {
          isShakingRef.current = false;
        }, SHAKE_COOLDOWN_MS);
      }
    };

    window.addEventListener('devicemotion', onMotion, true);
    return () => {
      window.removeEventListener('devicemotion', onMotion, true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, [enabled]);

  // ── 밝기 감지 (Canvas 픽셀 샘플링, 1초 간격) ────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timer = setInterval(() => {
      // 흔들림 감지 중엔 밝기 판정 스킵 (더 긴급한 상태 우선)
      if (isShakingRef.current) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.paused) return;

      ctx.drawImage(video, 0, 0, 32, 24);
      const { data } = ctx.getImageData(0, 0, 32, 24);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      const brightness = sum / (data.length / 4);
      setDetectedStatus(brightness < DARK_THRESHOLD ? 'dark' : 'good');
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled, videoRef]);

  return { detectedStatus };
}
