'use client';

import type { RefObject } from 'react';
import {
  Camera, Loader2, CheckCircle2, AlertTriangle, Sun,
  Lightbulb, Timer, FlipHorizontal2, Pause, Play,
} from 'lucide-react';
import type { CameraMode } from '@/hooks/useCameraStream';
import type { ScanStatusType } from '@/components/molecules/ScanStatusBanner';

type ScanPhase = 'guide' | 'white' | 'uv';

export default function CameraView({
  videoRef,
  imgRef,
  isReady,
  cameraError,
  cameraMode,
  phase,
  isPaused,
  lightOn,
  status,
  onLightToggle,
  onCameraFlip,
  onPauseToggle,
  onCapture,
  isCapturing,
  onRetry,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  imgRef: RefObject<HTMLImageElement | null>;
  isReady: boolean;
  cameraError: string | null;
  cameraMode: CameraMode;
  phase: ScanPhase;
  isPaused: boolean;
  lightOn: boolean;
  status: ScanStatusType;
  onLightToggle: () => void;
  onCameraFlip: () => void;
  onPauseToggle: () => void;
  onCapture: () => void;
  isCapturing: boolean;
  onRetry: () => void;
}) {
  const uvMode = phase === 'uv';
  const streamVisible = isReady && !cameraError;

  return (
    <div className={`relative w-full flex-1 overflow-hidden ${uvMode ? 'bg-[#1A0A2E]' : 'bg-[#1A1A2E]'}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300
          ${cameraMode === 'device' && streamVisible ? 'opacity-100' : 'opacity-0'}`}
      />
      <img
        ref={imgRef}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300
          ${cameraMode === 'esp32' && streamVisible ? 'opacity-100' : 'opacity-0'}`}
      />

      {(!isReady || cameraError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
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

      {uvMode && (
        <div className="absolute inset-0 bg-purple-900/25 pointer-events-none mix-blend-multiply" />
      )}

      {isReady && !cameraError && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="12" y="15" width="76" height="70" fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="3 2" strokeOpacity="0.55" rx="1" />
          <polyline points="19,15 12,15 12,22" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="81,15 88,15 88,22" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="12,78 12,85 19,85" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="81,85 88,85 88,78" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="50" y1="44" x2="50" y2="56" stroke="#4BC8A0" strokeWidth="0.9" strokeOpacity="0.9" />
          <line x1="44" y1="50" x2="56" y2="50" stroke="#4BC8A0" strokeWidth="0.9" strokeOpacity="0.9" />
        </svg>
      )}

      {isReady && !cameraError && (
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

      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button
          type="button"
          onClick={onLightToggle}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl text-[10px] font-medium transition-colors
            ${lightOn ? 'bg-warning/80 text-white' : 'bg-black/30 text-white'}`}
        >
          <Lightbulb size={16} />
          <span>{lightOn ? 'ON' : 'OFF'}</span>
        </button>
        <div className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl bg-black/30 text-white text-[10px] font-medium">
          <Timer size={16} />
          <span>3초</span>
        </div>
      </div>

      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <button
          type="button"
          onClick={onCameraFlip}
          className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl bg-black/30 text-white text-[10px] font-medium"
        >
          <FlipHorizontal2 size={16} />
          <span>카메라전환</span>
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
        <button
          type="button"
          onClick={onPauseToggle}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          {isPaused ? <Play size={18} className="text-white ml-0.5" /> : <Pause size={18} className="text-white" />}
        </button>
        <button
          type="button"
          onClick={onCapture}
          disabled={isCapturing || isPaused}
          className="w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-button disabled:opacity-50"
        >
          {isCapturing
            ? <Loader2 size={22} className="text-primary animate-spin" />
            : <Camera size={22} className="text-primary" />
          }
        </button>
        <div className="w-10 h-10" />
      </div>

      {isPaused && (
        <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2">
          <Pause size={40} className="text-white" />
          <span className="text-white font-semibold text-[15px]">일시정지됨</span>
        </div>
      )}
    </div>
  );
}
