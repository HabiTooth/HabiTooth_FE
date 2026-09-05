'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Camera, Loader2, CheckCircle2, AlertTriangle, Sun, Sparkles,
} from 'lucide-react';
import type { CameraMode, LedMode } from '@/hooks/useCameraStream';
import type { ScanStatusType } from '@/components/molecules/ScanStatusBanner';

export default function CameraView({
  videoRef,
  imgRef,
  isReady,
  cameraError,
  cameraMode,
  ledMode,
  archFolded,
  status,
  onLedToggle,
  onCapture,
  isCapturing,
  onRetry,
  reviewOverlay,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  imgRef: RefObject<HTMLImageElement | null>;
  isReady: boolean;
  cameraError: string | null;
  cameraMode: CameraMode;
  ledMode: LedMode;
  archFolded: boolean;
  status: ScanStatusType;
  onLedToggle: (mode: LedMode) => void;
  onCapture: () => void;
  isCapturing: boolean;
  onRetry: () => void;
  reviewOverlay?: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  // 접었을 때 영상이 커지지 않게, 펼친 상태의 높이를 기억해 두고 그대로 쓴다
  const [openHeight, setOpenHeight] = useState<number | null>(null);

  useEffect(() => {
    if (archFolded) return;
    const el = boxRef.current;
    if (!el) return;
    const update = () => setOpenHeight(el.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [archFolded]);

  const streamVisible = isReady && !cameraError;
  const reviewing = Boolean(reviewOverlay);

  // 미리보기만 반전, 저장본은 원본
  const mirror = 'scale-x-[-1]';

  return (
    <div
      ref={boxRef}
      className="relative w-full flex-1 overflow-hidden bg-[#1A1A2E] flex items-center justify-center"
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: archFolded && openHeight ? `${openHeight}px` : '100%' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mirror}
            ${cameraMode === 'device' && streamVisible ? 'opacity-100' : 'opacity-0'}`}
        />
        <img
          ref={imgRef}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mirror}
            ${cameraMode === 'esp32' && streamVisible ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {(!isReady || cameraError) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 bg-[#1A1A2E]">
          {cameraError ? (
            <>
              <Camera size={40} className="text-white/30" />
              <span className="text-white/50 text-[12px] text-center px-6 leading-relaxed whitespace-pre-line">
                {cameraError}
              </span>
              <button
                onClick={onRetry}
                className="mt-6 px-6 py-3 bg-primary text-white text-[14px] font-bold rounded-[12px] shadow-lg"
              >
                다시 시도하기
              </button>
            </>
          ) : (
            <>
              <Loader2 size={32} className="text-white/30 animate-spin" />
              <span className="text-white/40 text-[12px]">카메라 연결 중...</span>
            </>
          )}
        </div>
      )}

      {isReady && !cameraError && !reviewing && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-4 bg-[#4BC8A0]/70" />
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[1px] bg-[#4BC8A0]/70" />
        </div>
      )}

      {isReady && !cameraError && !reviewing && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          {status === 'good' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/85 backdrop-blur-sm text-white text-[11px] font-semibold whitespace-nowrap">
              <CheckCircle2 size={12} strokeWidth={2.5} />
              <span>잘 찍히고 있어요</span>
            </div>
          )}
          {status === 'shaking' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/85 backdrop-blur-sm text-white text-[11px] font-semibold whitespace-nowrap">
              <AlertTriangle size={12} strokeWidth={2.5} />
              <span>흔들림 감지됨</span>
            </div>
          )}
          {status === 'dark' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/85 backdrop-blur-sm text-white text-[11px] font-semibold whitespace-nowrap">
              <Sun size={12} strokeWidth={2.5} />
              <span>조명이 부족해요</span>
            </div>
          )}
        </div>
      )}

      {!reviewing && (
        <>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {([
              ['WHITE', '백색', Sun],
              ['UV', 'UV', Sparkles],
            ] as const).map(([mode, label, Icon]) => {
              const on = ledMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onLedToggle(mode)}
                  aria-pressed={on}
                  className={`w-11 h-11 rounded-full flex flex-col items-center justify-center gap-0.5
                    text-[9px] font-bold transition-colors
                    ${on ? 'bg-white text-content' : 'bg-white/15 text-white backdrop-blur-sm'}`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <button
              type="button"
              onClick={onCapture}
              disabled={isCapturing || !isReady || Boolean(cameraError)}
              className="w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-button disabled:opacity-50"
              aria-label="촬영"
            >
              {isCapturing
                ? <Loader2 size={22} className="text-primary animate-spin" />
                : <Camera size={22} className="text-primary" />
              }
            </button>
          </div>
        </>
      )}

      {reviewOverlay}
    </div>
  );
}
