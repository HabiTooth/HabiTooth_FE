'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  HelpCircle,
  Check,
  CheckCircle2,
  Lightbulb,
  Timer,
  FlipHorizontal2,
  Pause,
  Play,
  Lock,
  Loader2,
  XCircle,
  AlertTriangle,
  Sun,
  Camera,
  Bell,
  User,
} from 'lucide-react';
import StepIndicator from '@/components/molecules/StepIndicator';
import type { ScanStatusType } from '@/components/molecules/ScanStatusBanner';
import { useCameraStream } from '@/hooks/useCameraStream';
import { useScanDetection } from '@/hooks/useScanDetection';

type Step = 1 | 2 | 3 | 4;
type ScanPhase = 'guide' | 'white' | 'uv';
type ToothZone = 'ur' | 'ul' | 'lr' | 'll';

const STEP_LABELS = ['준비', '스캔 중', '분석 중', '완료'];
const ANALYZE_STEPS = [
  '이미지 품질 확인',
  '치태 의심 영역 탐지',
  '치석 가능 부위 분석',
  '구강 건강 지수 계산',
  '맞춤 리포트 생성',
];
const PHASE_LABELS = ['가이드 정렬', '백색광 촬영', 'UV 촬영'];
const ZONES: { id: ToothZone; label: string }[] = [
  { id: 'ur', label: '상악 우측' },
  { id: 'ul', label: '상악 좌측' },
  { id: 'lr', label: '하악 우측' },
  { id: 'll', label: '하악 좌측' },
];

function PageHeader({
  title,
  onExit,
  onHelp,
}: {
  title: string;
  onExit: () => void;
  onHelp: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 bg-white/80 backdrop-blur-sm border-b border-hairline flex-shrink-0">
      <button
        type="button"
        onClick={onExit}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
      >
        <X size={20} className="text-content" />
      </button>
      <span className="text-[15px] font-semibold text-content">{title}</span>
      <button
        type="button"
        onClick={onHelp}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
      >
        <HelpCircle size={20} className="text-muted" />
      </button>
    </div>
  );
}

function PhaseTabs({ phase }: { phase: ScanPhase }) {
  const phaseIdx = phase === 'guide' ? 0 : phase === 'white' ? 1 : 2;
  return (
    <div className="flex items-center justify-center bg-white border-b border-hairline px-4 py-2 flex-shrink-0">
      {PHASE_LABELS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center px-2">
            <span
              className={`text-[11px] font-semibold pb-1 border-b-2 transition-colors ${
                i === phaseIdx ? 'text-primary border-primary' : 'text-muted border-transparent'
              }`}
            >
              {i + 1}) {label}
            </span>
          </div>
          {i < PHASE_LABELS.length - 1 && <span className="text-hairline text-[10px] mx-1">—</span>}
        </div>
      ))}
    </div>
  );
}

function ZoneArchIcon({ zone, className = '' }: { zone: ToothZone; className?: string }) {
  const isUpper = zone === 'ur' || zone === 'ul';
  const isRight = zone === 'ur' || zone === 'lr';
  if (isUpper) {
    return (
      <svg width="26" height="14" viewBox="0 0 26 14" fill="none" className={className}>
        <path
          d="M2 13 C2 5 6 2 13 2 C20 2 24 5 24 13"
          stroke="#D0D8E5"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {isRight ? (
          <path
            d="M13 2 C20 2 24 5 24 13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M2 13 C2 5 6 2 13 2"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  }
  return (
    <svg width="26" height="14" viewBox="0 0 26 14" fill="none" className={className}>
      <path
        d="M2 1 C2 9 6 12 13 12 C20 12 24 9 24 1"
        stroke="#D0D8E5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {isRight ? (
        <path
          d="M13 12 C20 12 24 9 24 1"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M2 1 C2 9 6 12 13 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function ZoneSelector({
  currentZoneIdx,
  completedZones,
}: {
  currentZoneIdx: number;
  completedZones: number[];
}) {
  return (
    <div className="flex items-stretch bg-white border-t border-hairline flex-shrink-0">
      {ZONES.map(({ id, label }, i) => {
        const isDone = completedZones.includes(i);
        const isActive = i === currentZoneIdx && !isDone;
        return (
          <div
            key={id}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
              ${i < ZONES.length - 1 ? 'border-r border-hairline' : ''}
              ${isActive ? 'bg-primary-light' : ''}`}
          >
            <ZoneArchIcon
              zone={id}
              className={isDone || isActive ? 'text-primary' : 'text-muted/30'}
            />
            <span
              className={`text-[10px] font-bold mt-0.5 ${isDone || isActive ? 'text-primary' : 'text-muted/40'}`}
            >
              {isDone ? '✓' : `${i + 1}`}
            </span>
            <span
              className={`text-[9px] font-medium leading-none ${
                isActive ? 'text-primary' : isDone ? 'text-primary/70' : 'text-muted/40'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CameraView({
  videoRef,
  isReady,
  cameraError,
  phase,
  isPaused,
  lightOn,
  status,
  onLightToggle,
  onCameraFlip,
  onPauseToggle,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  cameraError: string | null;
  phase: ScanPhase;
  isPaused: boolean;
  lightOn: boolean;
  status: ScanStatusType;
  onLightToggle: () => void;
  onCameraFlip: () => void;
  onPauseToggle: () => void;
}) {
  const uvMode = phase === 'uv';
  return (
    <div
      className={`relative w-full flex-1 overflow-hidden ${uvMode ? 'bg-[#1A0A2E]' : 'bg-[#1A1A2E]'}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300
          ${isReady && !cameraError ? 'opacity-100' : 'opacity-0'}`}
      />

      {(!isReady || cameraError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
          {cameraError ? (
            <>
              <Camera size={40} className="text-white/30" />
              <span className="text-white/50 text-[12px] text-center px-6 leading-relaxed whitespace-pre-line">
                {cameraError}
              </span>
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
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect
            x="12"
            y="15"
            width="76"
            height="70"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            strokeOpacity="0.55"
            rx="1"
          />
          <polyline
            points="19,15 12,15 12,22"
            fill="none"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="81,15 88,15 88,22"
            fill="none"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="12,78 12,85 19,85"
            fill="none"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="81,85 88,85 88,78"
            fill="none"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="50"
            y1="44"
            x2="50"
            y2="56"
            stroke="#4BC8A0"
            strokeWidth="0.9"
            strokeOpacity="0.9"
          />
          <line
            x1="44"
            y1="50"
            x2="56"
            y2="50"
            stroke="#4BC8A0"
            strokeWidth="0.9"
            strokeOpacity="0.9"
          />
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

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <button
          type="button"
          onClick={onPauseToggle}
          className="w-14 h-14 rounded-full bg-primary-gradient flex items-center justify-center shadow-button"
        >
          {isPaused ? (
            <Play size={22} className="text-white ml-0.5" />
          ) : (
            <Pause size={22} className="text-white" />
          )}
        </button>
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

function ScanProgressBar({
  progress,
  phase,
  zoneIdx,
}: {
  progress: number;
  phase: ScanPhase;
  zoneIdx: number;
}) {
  const uvMode = phase === 'uv';
  const zoneName = ZONES[zoneIdx]?.label ?? '';
  const pct = Math.round(progress);
  return (
    <div className="px-4 pt-3 pb-5 bg-white flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-content">{zoneName} 스캔 중</span>
        <span
          className={`text-[13px] font-bold tabular-nums ${uvMode ? 'text-[#A78BFA]' : 'text-primary'}`}
        >
          {pct}%
        </span>
      </div>
      <div className="h-2.5 bg-hairline rounded-full relative">
        <div
          className={`h-full rounded-full transition-[width] duration-300 overflow-hidden relative ${uvMode ? 'bg-[#A78BFA]' : 'bg-primary-gradient'}`}
          style={{ width: `${progress}%` }}
        >
          <div className="progress-shimmer absolute inset-0" />
        </div>
        {progress > 2 && progress < 99 && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white transition-[left] duration-300
              ${uvMode ? 'bg-[#A78BFA] shadow-[0_0_7px_rgba(167,139,250,0.9)]' : 'bg-primary shadow-[0_0_7px_rgba(74,134,217,0.9)]'}`}
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        )}
      </div>
    </div>
  );
}

function Step1({
  checked,
  onCheck,
  onExit,
  onStart,
}: {
  checked: boolean;
  onCheck: (v: boolean) => void;
  onExit: () => void;
  onStart: () => void;
}) {
  const [skipNext, setSkipNext] = useState(false);
  return (
    <div className="max-w-[430px] min-h-svh mx-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-hairline flex-shrink-0">
        <button
          type="button"
          onClick={onExit}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
        >
          <X size={20} className="text-content" />
        </button>
        <span className="text-[15px] font-semibold text-content">AI 스캔</span>
        <div className="flex items-center gap-1.5">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors">
            <Bell size={20} className="text-content" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4B7BF5] rounded-full border-[1.5px] border-white" />
          </div>
          <div className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors">
            <User size={20} className="text-content" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-hairline flex-shrink-0">
        {(['1 준비', '2 스캔 중', '3 분석 중', '4 완료'] as const).map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[11px] font-semibold whitespace-nowrap ${i === 0 ? 'text-[#4B7BF5]' : 'text-muted'}`}
              >
                {label}
              </span>
            </div>
            {i < 3 && (
              <div className="flex-1 h-[2px] rounded-full min-w-[8px]"
                   style={{ background: i === 0 ? 'linear-gradient(90deg, #4B7BF5, #c7d6ff)' : '#E5EDF5' }} />
            )}
          </div>
        ))}
      </div>

      <div
        className="relative flex-1 overflow-visible"
        style={{ background: 'linear-gradient(145deg, #3D58E8 0%, #5B7CF5 55%, #8AA4FF 100%)' }}
      >
        <div
          className="absolute -right-20 -top-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <div
          className="absolute right-8 top-20 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
        <div
          className="absolute -left-10 bottom-28 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: 'rgba(103,232,249,0.07)' }}
        />

        <svg style={{ position: 'absolute', top: 18, left: 28, animation: 'sparkle-twinkle 2.1s ease-in-out infinite' }} width="10" height="10" viewBox="0 0 12 12">
          <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.7" />
        </svg>
        <svg style={{ position: 'absolute', bottom: 110, left: 52, animation: 'sparkle-twinkle 1.7s ease-in-out 0.5s infinite' }} width="7" height="7" viewBox="0 0 12 12">
          <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.45" />
        </svg>
        <svg style={{ position: 'absolute', top: '42%', left: '36%', animation: 'sparkle-twinkle 2.4s ease-in-out 1s infinite' }} width="6" height="6" viewBox="0 0 12 12">
          <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.35" />
        </svg>
        <svg style={{ position: 'absolute', top: 62, right: 24, animation: 'sparkle-twinkle 1.9s ease-in-out 0.8s infinite' }} width="8" height="8" viewBox="0 0 12 12">
          <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.5" />
        </svg>

        <div className="px-5 pt-7 flex flex-col gap-2">
          <h1 className="m-0 text-white font-bold leading-tight" style={{ fontSize: '28px' }}>
            실시간 구강 스캔
          </h1>
          <p className="m-0 text-white/80 leading-relaxed" style={{ fontSize: '13px' }}>
            입 안을 천천히 움직이며
            <br />
            전체를 스캔해 주세요.
          </p>
        </div>

        <div style={{ position: 'absolute', bottom: 132, left: 110, zIndex: 15, animation: 'splash-float 5s ease-in-out infinite' }}>
          <div className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5"
               style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}>
            <span className="text-white text-[11px] font-semibold">✓ 치태 탐지</span>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 80, left: 82, zIndex: 15, animation: 'splash-float 6.5s ease-in-out 0.7s infinite' }}>
          <div className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5"
               style={{ animation: 'glow-pulse 2.5s ease-in-out 0.5s infinite' }}>
            <span className="text-white text-[11px] font-semibold">✓ 치석 분석</span>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 24, left: 110, zIndex: 15, animation: 'splash-float 7s ease-in-out 1.4s infinite' }}>
          <div className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5"
               style={{ animation: 'glow-pulse 3.5s ease-in-out 1.1s infinite' }}>
            <span className="text-white text-[11px] font-semibold">✓ 구강 건강 점수</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 30,
            right: 14,
            width: 200,
            height: 200,
            zIndex: 20,
          }}
        >
          <div
            className="glow-orb"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(103,232,249,0.5) 0%, rgba(75,123,245,0.35) 45%, transparent 72%)',
            }}
          />
          <div
            className="orbit-ring"
            style={{
              position: 'absolute',
              width: '118%',
              height: '118%',
              top: '-9%',
              left: '-9%',
              border: '1.5px solid rgba(255,255,255,0.22)',
              borderRadius: '50%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 9,
                height: 9,
                background: 'rgba(103,232,249,0.95)',
                borderRadius: '50%',
                top: '8%',
                left: '72%',
                boxShadow: '0 0 10px rgba(103,232,249,0.9)',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              top: '10%',
              left: '10%',
              border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: '50%',
              animation: 'orbit-spin 11s linear infinite',
              animationDirection: 'reverse',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 7,
                height: 7,
                background: 'rgba(167,139,250,0.9)',
                borderRadius: '50%',
                bottom: '14%',
                right: '18%',
                boxShadow: '0 0 8px rgba(167,139,250,0.8)',
              }}
            />
          </div>
          <svg style={{ position: 'absolute', top: '2%', right: '-4%', animation: 'sparkle-twinkle 1.6s ease-in-out infinite' }} width="13" height="13" viewBox="0 0 12 12">
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.95" />
          </svg>
          <svg style={{ position: 'absolute', bottom: '18%', right: '-7%', animation: 'sparkle-twinkle 2.1s ease-in-out 0.35s infinite' }} width="9" height="9" viewBox="0 0 12 12">
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.7" />
          </svg>
          <svg style={{ position: 'absolute', top: '12%', left: '-6%', animation: 'sparkle-twinkle 1.9s ease-in-out 0.7s infinite' }} width="10" height="10" viewBox="0 0 12 12">
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.6" />
          </svg>
          <img
            src="/images/tooth-3.png"
            alt="tooth"
            style={{
              width: 200,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              filter:
                'drop-shadow(0 8px 28px rgba(75,123,245,0.55)) drop-shadow(0 0 20px rgba(103,232,249,0.4))',
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col">
        <div className="px-5 pt-5 pb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <GuideItem
              icon={<Camera size={18} className="text-primary" />}
              text="카메라를 치아 가까이 가져가세요"
              sub="5~10cm 거리를 유지해 주세요."
            />
            <GuideItem
              icon={<AlertTriangle size={18} className="text-warning" />}
              text="흔들리지 않게 천천히 움직여 주세요"
              sub="빠른 움직임은 스캔 품질을 낮춰요."
            />
            <GuideItem
              icon={<Sun size={18} className="text-success" />}
              text="빛 반사 없이 각도를 조절하세요"
              sub="과도한 반사는 분석을 방해해요."
            />
          </div>
          <div className="border-t border-hairline pt-4 flex flex-col gap-2.5">
            <CheckboxRow
              checked={checked}
              onChange={() => onCheck(!checked)}
              label="위 안내를 모두 확인했어요"
            />
            <CheckboxRow
              checked={skipNext}
              onChange={() => setSkipNext((v) => !v)}
              label="다음부터 안내 생략"
              muted
            />
          </div>
        </div>
        <div className="px-5 pb-10 pt-3">
          <button
            type="button"
            onClick={onStart}
            disabled={!checked}
            className="w-full h-14 rounded-[14px] text-white text-[16px] font-semibold
              disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #4B7BF5 0%, #6B9BFF 100%)',
              boxShadow: '0 4px 16px rgba(75,123,245,0.35)',
            }}
          >
            스캔 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideItem({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-9 h-9 rounded-[12px] bg-primary-light flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="pt-0.5">
        <p className="m-0 text-[13px] font-semibold text-content">{text}</p>
        <p className="m-0 text-[12px] text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  muted,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0 self-start"
    >
      <span
        className={`w-[20px] h-[20px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-colors
        ${checked ? 'bg-primary border-primary' : 'bg-white border-hairline'}`}
      >
        <span className={`transition-transform ${checked ? 'scale-100' : 'scale-0'}`}>
          <Check size={12} color="white" strokeWidth={3} />
        </span>
      </span>
      <span className={`text-[13px] font-medium ${muted ? 'text-muted' : 'text-content'}`}>
        {label}
      </span>
    </button>
  );
}

function Step2({
  videoRef,
  isReady,
  cameraError,
  phase,
  status,
  progress,
  isPaused,
  lightOn,
  currentZoneIdx,
  completedZones,
  onExit,
  onHelp,
  onPauseToggle,
  onLightToggle,
  onCameraFlip,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  cameraError: string | null;
  phase: ScanPhase;
  status: ScanStatusType;
  progress: number;
  isPaused: boolean;
  lightOn: boolean;
  currentZoneIdx: number;
  completedZones: number[];
  onExit: () => void;
  onHelp: () => void;
  onPauseToggle: () => void;
  onLightToggle: () => void;
  onCameraFlip: () => void;
}) {
  return (
    <div className="max-w-[430px] mx-auto h-svh flex flex-col">
      <PageHeader title="실시간 구강 스캔" onExit={onExit} onHelp={onHelp} />
      <div className="px-4 pt-3 pb-2 bg-white flex-shrink-0">
        <StepIndicator steps={STEP_LABELS} current={2} />
      </div>
      <PhaseTabs phase={phase} />
      <CameraView
        videoRef={videoRef}
        isReady={isReady}
        cameraError={cameraError}
        phase={phase}
        isPaused={isPaused}
        lightOn={lightOn}
        status={status}
        onLightToggle={onLightToggle}
        onCameraFlip={onCameraFlip}
        onPauseToggle={onPauseToggle}
      />
      <ZoneSelector currentZoneIdx={currentZoneIdx} completedZones={completedZones} />
      <ScanProgressBar progress={progress} phase={phase} zoneIdx={currentZoneIdx} />
    </div>
  );
}

function Step3({ analyzeStep, analyzeProgress }: { analyzeStep: number; analyzeProgress: number }) {
  return (
    <div className="max-w-[430px] min-h-svh mx-auto bg-background flex flex-col items-center justify-center px-6 gap-5 relative z-10">
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />
      <div className="animate-pulse-tooth relative z-10">
        <ToothIcon size={80} className="text-primary" />
      </div>
      <div className="text-center relative z-10">
        <h2 className="m-0 text-[22px] font-bold text-content">분석 중이에요</h2>
        <p className="m-0 mt-1 text-[13px] text-muted">AI가 구강 상태를 정밀하게 분석하고 있어요</p>
      </div>

      <div className="w-full bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card px-4 py-3 flex flex-col gap-3 relative z-10">
        {ANALYZE_STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < analyzeStep;
          const active = n === analyzeStep;
          return (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                ${done ? 'bg-primary' : active ? 'bg-primary-light' : 'bg-hairline'}`}
              >
                {done ? (
                  <Check size={13} className="text-white" strokeWidth={3} />
                ) : active ? (
                  <Loader2 size={13} className="text-primary animate-spin" />
                ) : (
                  <span className="text-[11px] font-bold text-muted">{n}</span>
                )}
              </div>
              <span
                className={`text-[13px] font-medium flex-1 ${done || active ? 'text-content' : 'text-muted'}`}
              >
                {label}
              </span>
              {done && <CheckCircle2 size={14} className="text-primary" />}
              {active && <Loader2 size={14} className="text-primary animate-spin" />}
            </div>
          );
        })}
      </div>

      <div className="w-full relative z-10">
        <div className="flex justify-between mb-2 text-[12px] text-muted font-medium">
          <span>전체 진행률</span>
          <span className="text-primary font-bold">{analyzeProgress}%</span>
        </div>
        <div className="h-2 bg-hairline rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-gradient rounded-full transition-all duration-500"
            style={{ width: `${analyzeProgress}%` }}
          />
        </div>
      </div>

      <p className="text-[12px] text-muted text-center m-0 relative z-10">
        분석이 완료되면 자동으로 결과 화면으로 이동합니다.
      </p>
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card px-4 py-2.5 w-full relative z-10">
        <Lock size={14} className="text-primary flex-shrink-0" />
        <span className="text-[12px] text-primary font-medium">
          안전하게 분석 중이에요 — 모든 데이터는 암호화되어 보호됩니다.
        </span>
      </div>
    </div>
  );
}

function SandRevealImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const filterId = useRef(`sand-${Math.random().toString(36).slice(2, 9)}`).current;
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const DURATION = 1300;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / DURATION, 1);
      setProg(1 - Math.pow(1 - t, 4));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className={className} style={{ position: 'relative', overflow: 'visible' }}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={(1 - prog) * 130} xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feOffset in="displaced" dx={(1 - prog) * -25} dy={(1 - prog) * -70} result="shifted" />
            <feGaussianBlur in="shifted" stdDeviation={(1 - prog) * 6} result="blurred" />
            <feColorMatrix in="blurred" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${prog} 0`} />
          </filter>
        </defs>
      </svg>
      <img src={src} alt={alt} style={{ filter: `url(#${filterId})`, width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

function Step4({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowCheck(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-[430px] min-h-svh mx-auto bg-background flex flex-col relative overflow-hidden">
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-6 gap-6">
        <div className="relative w-[160px] h-[160px]">
          <SandRevealImage src="/images/tooth-3.png" alt="tooth" className="w-full h-full" />
          {showCheck && (
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-success rounded-full flex items-center justify-center shadow-card animate-bounce-in">
              <Check size={18} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="text-center">
          <h2 className="m-0 text-[26px] font-bold text-content">스캔 완료!</h2>
          <p className="m-0 mt-2 text-[13px] text-muted leading-relaxed">
            4개 구역 스캔이 모두 완료됐어요.
            <br />
            AI 분석을 시작할 준비가 됐어요.
          </p>
        </div>

        <div className="w-full bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card px-4 pt-3.5 pb-4">
          <p className="m-0 text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
            스캔 완료 구역
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ZONES.map(({ id, label }) => (
              <div
                key={id}
                className="flex flex-col items-center gap-1.5 py-3 bg-primary-light rounded-[14px]"
              >
                <ZoneArchIcon zone={id} className="text-primary" />
                <span className="text-[9px] font-semibold text-primary leading-none">{label}</span>
                <CheckCircle2 size={11} className="text-success" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-success/15 flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-success" />
          </div>
          <div>
            <p className="m-0 text-[13px] font-semibold text-content">데이터 처리 완료</p>
            <p className="m-0 text-[12px] text-muted mt-0.5">이미지 품질 확인 · 암호화 완료</p>
          </div>
          <CheckCircle2 size={16} className="text-success ml-auto flex-shrink-0" />
        </div>
      </div>

      <div className="relative z-10 px-6 pb-10 pt-2 flex flex-col gap-3">
        <button
          type="button"
          onClick={onNext}
          className="w-full h-14 rounded-[14px] bg-primary-gradient text-white text-[16px] font-semibold shadow-button"
        >
          분석 결과 보기
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full h-11 text-[14px] font-semibold text-primary bg-transparent border-none cursor-pointer"
        >
          다시 스캔하기
        </button>
      </div>
    </div>
  );
}

function ExitModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[320px] overflow-hidden">
        <div className="px-5 pt-5 pb-4 text-center">
          <h3 className="m-0 text-[17px] font-bold text-content">스캔을 중단할까요?</h3>
          <p className="m-0 mt-1.5 text-[13px] text-muted leading-relaxed">
            지금까지 촬영한 데이터가 모두 삭제됩니다.
          </p>
        </div>
        <div className="flex border-t border-hairline">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 text-[15px] font-semibold text-primary border-r border-hairline bg-transparent"
          >
            계속 촬영
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3.5 text-[15px] font-semibold text-danger bg-transparent"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpBottomSheet({ onClose }: { onClose: () => void }) {
  const items: { icon: React.ReactNode; label: string; desc: string }[] = [
    {
      icon: <CheckCircle2 size={16} className="text-success" />,
      label: '잘 찍히고 있어요',
      desc: '적절한 거리와 조명, 안정적인 상태입니다.',
    },
    {
      icon: <XCircle size={16} className="text-danger" />,
      label: '너무 멀어요 / 가까워요',
      desc: '카메라와 치아 사이 거리를 조절해 주세요.',
    },
    {
      icon: <AlertTriangle size={16} className="text-danger" />,
      label: '흔들림이 감지됐어요',
      desc: '카메라를 안정적으로 유지해 주세요.',
    },
    {
      icon: <Sun size={16} className="text-warning" />,
      label: '조명이 부족해요',
      desc: '조명을 밝게 하거나 그림자를 제거해 주세요.',
    },
    {
      icon: <CheckCircle2 size={16} className="text-primary" />,
      label: '스캔 범위가 충분해요',
      desc: '거의 다 스캔되었어요! 마무리해 주세요.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl w-full max-w-[430px] pb-8">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-hairline rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 border-b border-hairline">
          <span className="text-[16px] font-bold text-content">상태 안내</span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-hairline"
          >
            <X size={16} className="text-content" />
          </button>
        </div>
        <div className="px-5 pt-4 flex flex-col gap-4">
          {items.map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-hairline flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="m-0 text-[13px] font-semibold text-content">{label}</p>
                <p className="m-0 text-[12px] text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToothIcon({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M32 4C24 4 14 8 14 18C14 24 16 28 16 34C16 44 18 60 24 60C28 60 28 52 32 52C36 52 36 60 40 60C46 60 48 44 48 34C48 28 50 24 50 18C50 8 40 4 32 4Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M22 14C22 14 26 20 32 20C38 20 42 14 42 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [phase, setPhase] = useState<ScanPhase>('white');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentZoneIdx, setCurrentZoneIdx] = useState(0);
  const [completedZones, setCompletedZones] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const {
    videoRef,
    isReady,
    error: cameraError,
    lightOn,
    startCamera,
    stopCamera,
    toggleLight,
    flipCamera,
  } = useCameraStream();

  const { detectedStatus } = useScanDetection({
    videoRef,
    enabled: step === 2 && !isPaused && isReady,
  });

  // ref에 저장해서 useEffect 의존성 없이 항상 최신 함수 참조 유지
  const startCameraRef = useRef(startCamera);
  const stopCameraRef = useRef(stopCamera);
  useEffect(() => {
    startCameraRef.current = startCamera;
  });
  useEffect(() => {
    stopCameraRef.current = stopCamera;
  });

  useEffect(() => {
    if (step === 2) startCameraRef.current();
    else stopCameraRef.current();
  }, [step]);

  // 100ms마다 100/150씩 누적 → 구역당 15초. setCompletedZones 함수형 업데이트로 클로저 문제 방지
  useEffect(() => {
    if (step !== 2 || isPaused) return;
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 100 / 150, 100);
        if (next >= 100) {
          clearInterval(t);
          setCompletedZones((prev) => {
            const updated = [...prev, currentZoneIdx];
            if (updated.length >= ZONES.length) {
              setTimeout(() => setStep(3), 600);
            } else {
              setTimeout(() => {
                setCurrentZoneIdx((i) => i + 1);
                setProgress(0);
              }, 400);
            }
            return updated;
          });
        }
        return next;
      });
    }, 100);
    return () => clearInterval(t);
  }, [step, isPaused, currentZoneIdx]);

  useEffect(() => {
    if (step !== 3) return;
    let n = 0;
    setAnalyzeStep(1);
    setAnalyzeProgress(0);
    const t = setInterval(() => {
      n++;
      setAnalyzeStep(n + 1);
      setAnalyzeProgress(Math.round((n / ANALYZE_STEPS.length) * 100));
      if (n >= ANALYZE_STEPS.length) {
        clearInterval(t);
        setTimeout(() => setStep(4), 800);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [step]);

  const handleReset = () => {
    setStep(1);
    setPhase('white');
    setProgress(0);
    setIsPaused(false);
    setCurrentZoneIdx(0);
    setCompletedZones([]);
    setChecked(false);
    setAnalyzeStep(0);
    setAnalyzeProgress(0);
  };

  return (
    <div>
      {step === 1 && (
        <Step1
          checked={checked}
          onCheck={setChecked}
          onExit={() => setShowExitModal(true)}
          onStart={() => {
            setStep(2);
            setCurrentZoneIdx(0);
            setCompletedZones([]);
            setProgress(0);
          }}
        />
      )}
      {step === 2 && (
        <Step2
          videoRef={videoRef}
          isReady={isReady}
          cameraError={cameraError}
          phase={phase}
          status={detectedStatus}
          progress={progress}
          isPaused={isPaused}
          lightOn={lightOn}
          currentZoneIdx={currentZoneIdx}
          completedZones={completedZones}
          onExit={() => setShowExitModal(true)}
          onHelp={() => setShowHelp(true)}
          onPauseToggle={() => setIsPaused((p) => !p)}
          onLightToggle={toggleLight}
          onCameraFlip={flipCamera}
        />
      )}
      {step === 3 && <Step3 analyzeStep={analyzeStep} analyzeProgress={analyzeProgress} />}
      {step === 4 && <Step4 onNext={() => router.push('/analysis')} onReset={handleReset} />}

      {showExitModal && (
        <ExitModal onCancel={() => setShowExitModal(false)} onConfirm={() => router.back()} />
      )}
      {showHelp && <HelpBottomSheet onClose={() => setShowHelp(false)} />}
    </div>
  );
}
