'use client';

import { useState, useEffect, useRef, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { X, HelpCircle, Check, CheckCircle2, Lock, Loader2, AlertTriangle, Sun, Camera, Bell, User } from 'lucide-react';
import StepIndicator from '@/components/molecules/StepIndicator';
import type { ScanStatusType } from '@/components/molecules/ScanStatusBanner';
import { useCameraStream, type CameraMode } from '@/hooks/useCameraStream';
import { useScanDetection } from '@/hooks/useScanDetection';
import { scanApi, type ViewType, type AnalysisResultSummary } from '@/lib/api/scan';
import { useAuthStore } from '@/stores/authStore';
import ZoneArchIcon from '@/components/atoms/ZoneArchIcon';
import SandRevealImage from '@/components/atoms/SandRevealImage';
import ToothIcon from '@/components/atoms/ToothIcon';
import GuideItem from '@/components/molecules/GuideItem';
import ScanProgressBar from '@/components/molecules/ScanProgressBar';
import CameraView from '@/components/organisms/CameraView';
import ScanExitModal from '@/components/organisms/ScanExitModal';
import ScanHelpSheet from '@/components/organisms/ScanHelpSheet';
import Checkbox from '@/components/atoms/Checkbox';

type Step = 1 | 2 | 3 | 4;
type ScanPhase = 'guide' | 'white' | 'uv';

const STEP_LABELS = ['준비', '스캔 중', '분석 중', '완료'];
const ANALYZE_STEPS = [
  '이미지 품질 확인',
  '치태 의심 영역 탐지',
  '치석 가능 부위 분석',
  '구강 건강 지수 계산',
  '맞춤 리포트 생성',
];
const PHASE_LABELS = ['가이드 정렬', '백색광 촬영', 'UV 촬영'];
const ZONES: { viewType: ViewType; label: string }[] = [
  { viewType: 'UPPER_LEFT',   label: '상악 좌' },
  { viewType: 'UPPER_CENTER', label: '상악 중' },
  { viewType: 'UPPER_RIGHT',  label: '상악 우' },
  { viewType: 'OUTER_LEFT',   label: '외측 좌' },
  { viewType: 'OUTER_CENTER', label: '외측 중' },
  { viewType: 'OUTER_RIGHT',  label: '외측 우' },
  { viewType: 'LOWER_LEFT',   label: '하악 좌' },
  { viewType: 'LOWER_CENTER', label: '하악 중' },
  { viewType: 'LOWER_RIGHT',  label: '하악 우' },
];

// BE AI 분석 구현 전까지 쓰는 테스트용 데이터
const MOCK_ANALYSIS_RESULT: AnalysisResultSummary = {
  sessionId: 0,
  analysisResultSummaries: ZONES.map((z, i) => ({
    analysisResultId: i + 1,
    score: [82, 75, 78, 90, 68, 85, 72, 88, 79][i],
    viewType: z.viewType,
  })),
  averageScore: 80,
};

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

const ZONE_GROUPS = [
  { label: '상악', range: [0, 1, 2] },
  { label: '외측', range: [3, 4, 5] },
  { label: '하악', range: [6, 7, 8] },
];

function ZoneSelector({
  currentZoneIdx,
  completedZones,
}: {
  currentZoneIdx: number;
  completedZones: number[];
}) {
  return (
    <div className="flex items-center bg-white border-t border-hairline px-3 py-2 gap-2 flex-shrink-0">
      {ZONE_GROUPS.map(({ label, range }, gi) => (
        <div key={label} className="flex items-center gap-1.5 flex-1">
          {gi > 0 && <div className="h-4 w-px bg-hairline flex-shrink-0" />}
          <span className="text-[9px] font-semibold text-muted/60 w-5 flex-shrink-0 text-center">{label}</span>
          {range.map((i) => {
            const isDone = completedZones.includes(i);
            const isActive = i === currentZoneIdx && !isDone;
            return (
              <div
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors
                  ${isDone ? 'bg-primary text-white' : isActive ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-hairline text-muted/40'}`}
              >
                {isDone ? <Check size={10} strokeWidth={3} /> : i + 1}
              </div>
            );
          })}
        </div>
      ))}
      <span className="text-[10px] font-bold text-muted ml-auto flex-shrink-0">
        {completedZones.length}/9
      </span>
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
            <Checkbox
              checked={checked}
              onChange={onCheck}
              label="위 안내를 모두 확인했어요"
            />
            <Checkbox
              checked={skipNext}
              onChange={setSkipNext}
              label="다음부터 안내 생략"
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

function Step2({
  videoRef,
  imgRef,
  isReady,
  cameraError,
  cameraMode,
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
  onCapture,
  isCapturing,
  onLightToggle,
  onCameraFlip,
  onRetry,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  imgRef: RefObject<HTMLImageElement | null>;
  isReady: boolean;
  cameraError: string | null;
  cameraMode: CameraMode;
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
  onCapture: () => void;
  isCapturing: boolean;
  onLightToggle: () => void;
  onCameraFlip: () => void;
  onRetry: () => void;
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
        imgRef={imgRef}
        isReady={isReady}
        cameraError={cameraError}
        cameraMode={cameraMode}
        phase={phase}
        isPaused={isPaused}
        lightOn={lightOn}
        status={status}
        onLightToggle={onLightToggle}
        onCameraFlip={onCameraFlip}
        onPauseToggle={onPauseToggle}
        onCapture={onCapture}
        isCapturing={isCapturing}
        onRetry={onRetry}
      />
      {isReady && !cameraError && (
        <>
          <ZoneSelector currentZoneIdx={currentZoneIdx} completedZones={completedZones} />
          <ScanProgressBar progress={progress} zoneName={ZONES[currentZoneIdx]?.label ?? ''} isUv={phase === 'uv'} />
        </>
      )}
    </div>
  );
}

function Step3({
  analyzeStep,
  analyzeProgress,
  analyzeError,
  onRetry,
  onReset,
}: {
  analyzeStep: number;
  analyzeProgress: number;
  analyzeError: string | null;
  onRetry: () => void;
  onReset: () => void;
}) {
  if (analyzeError) {
    return (
      <div className="max-w-[430px] min-h-svh mx-auto bg-background flex flex-col items-center justify-center px-6 gap-5 relative z-10">
        <div className="aurora-blob-1" />
        <div className="aurora-blob-2" />
        <div className="aurora-blob-3" />
        <div className="relative z-10">
          <AlertTriangle size={64} className="text-warning" />
        </div>
        <div className="text-center relative z-10">
          <h2 className="m-0 text-[22px] font-bold text-content">분석 실패</h2>
          <p className="m-0 mt-2 text-[13px] text-muted leading-relaxed whitespace-pre-line">{analyzeError}</p>
        </div>
        <div className="w-full relative z-10 flex flex-col gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full h-14 rounded-[14px] bg-primary-gradient text-white text-[15px] font-semibold shadow-button"
          >
            분석 다시 시도
          </button>
          <button
            type="button"
            onClick={onReset}
            className="w-full h-11 text-[14px] font-semibold text-muted bg-transparent border-none cursor-pointer"
          >
            처음부터 다시 스캔
          </button>
        </div>
      </div>
    );
  }

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


function Step4({
  onNext,
  onReset,
  analysisResult,
}: {
  onNext: () => void;
  onReset: () => void;
  analysisResult: AnalysisResultSummary | null;
}) {
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
            9개 구역 스캔이 모두 완료됐어요.
            <br />
            AI 분석이 완료되었어요.
          </p>
          {analysisResult && (
            <div className="mt-4 text-center">
              <div className="text-[14px] font-semibold text-content mb-1">건강도 점수</div>
              <div className="text-[28px] font-bold text-primary">{analysisResult.averageScore}</div>
            </div>
          )}
        </div>

        <div className="w-full bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card px-4 pt-3.5 pb-4">
          <p className="m-0 text-[11px] font-bold text-muted uppercase tracking-widest mb-3">
            스캔 완료 구역
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ZONES.map(({ viewType, label }) => (
              <div
                key={viewType}
                className="flex flex-col items-center gap-1.5 py-2.5 bg-primary-light rounded-[14px]"
              >
                <ZoneArchIcon viewType={viewType} className="text-primary" />
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


export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [phase, setPhase] = useState<ScanPhase>('white');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentZoneIdx, setCurrentZoneIdx] = useState(0);
  const [completedZones, setCompletedZones] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultSummary | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeKey, setAnalyzeKey] = useState(0);

  const { deviceId, deviceIp } = useAuthStore();
  const uploadedImageIds = useRef<number[]>([]);
  const progressRef = useRef(0);
  const completedCountRef = useRef(0);
  const capturedZonesRef = useRef<Set<number>>(new Set());

  const {
    videoRef,
    imgRef,
    isReady,
    error: cameraError,
    lightOn,
    cameraMode,
    startCamera,
    stopCamera,
    toggleLight,
    flipCamera,
  } = useCameraStream();

  const captureAndUpload = async (zoneIdx: number) => {
    if (!sessionId) { console.error('세션이 없습니다'); return; }

    let file: File;
    try {
      if (cameraMode === 'esp32' && deviceIp) {

        const host = deviceIp.split(':')[0];
        const res = await fetch(`/api/camera/capture?ip=${host}`);
        if (!res.ok) throw new Error('capture proxy failed');
        const blob = await res.blob();
        file = new File([blob], `scan_zone${zoneIdx}.jpg`, { type: 'image/jpeg' });
      } else {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video?.videoWidth || 640;
        canvas.height = video?.videoHeight || 480;
        if (video) canvas.getContext('2d')?.drawImage(video, 0, 0);
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/jpeg', 0.85),
        );
        file = new File([blob], `scan_zone${zoneIdx}.jpg`, { type: 'image/jpeg' });
      }

      const res = await scanApi.uploadImageToSession(sessionId, {
        file,
        viewType: ZONES[zoneIdx]?.viewType ?? 'UPPER_LEFT',
        lightType: 'WHITE_LIGHT',
      });
      uploadedImageIds.current.push(res.data.result.imageId);
    } catch (e) {
      console.error('scan upload failed zone', zoneIdx, e);
    }
  };

  const { detectedStatus } = useScanDetection({
    videoRef,
    enabled: step === 2 && isReady,
  });


  const startCameraRef = useRef(startCamera);
  const stopCameraRef = useRef(stopCamera);
  useEffect(() => {
    startCameraRef.current = startCamera;
  });
  useEffect(() => {
    stopCameraRef.current = stopCamera;
  });

  useEffect(() => {
    if (step === 2) {

      if (deviceIp) {
        const streamUrl = `http://${deviceIp}/stream`;


        startCameraRef.current('esp32', streamUrl);
      } else {

        startCameraRef.current('device');
      }
    } else {
      stopCameraRef.current();
    }
  }, [step, deviceIp]);


  const completeZone = async (zoneIdx: number) => {
    if (capturedZonesRef.current.has(zoneIdx)) return; // 중복 촬영 방지
    capturedZonesRef.current.add(zoneIdx);
    await captureAndUpload(zoneIdx);
    const newCount = completedCountRef.current + 1;
    completedCountRef.current = newCount;
    setCompletedZones((prev) => [...prev, zoneIdx]);
    if (newCount >= ZONES.length) {
      setTimeout(() => setStep(3), 600);
    } else {
      progressRef.current = 0;
      setProgress(0);
      setCurrentZoneIdx((i) => i + 1);
    }
  };


  useEffect(() => {
    if (step !== 2 || isPaused) return;
    const t = setInterval(() => {
      const next = Math.min(progressRef.current + 100 / 150, 100);
      progressRef.current = next;
      setProgress(next);
      if (next >= 100) {
        clearInterval(t);
        completeZone(currentZoneIdx);
      }
    }, 100);
    return () => clearInterval(t);
  }, [step, isPaused, currentZoneIdx]);


  const handleCapture = async () => {
    if (isCapturing || !isReady) return;
    setIsCapturing(true);
    try {
      await completeZone(currentZoneIdx);
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (step !== 3 || !sessionId) return;
    let n = 0;
    setAnalyzeStep(1);
    setAnalyzeProgress(0);
    setAnalyzeError(null);

    const t = setInterval(() => {
      n++;
      setAnalyzeStep(n + 1);
      setAnalyzeProgress(Math.round((n / ANALYZE_STEPS.length) * 100));
      if (n >= ANALYZE_STEPS.length) clearInterval(t);
    }, 2000);

    scanApi
      .analyzeSession(sessionId)
      .then((res: { data: { result: AnalysisResultSummary } }) => {
        setAnalysisResult(res.data.result);
        clearInterval(t);
        setAnalyzeStep(ANALYZE_STEPS.length + 1);
        setAnalyzeProgress(100);
        setTimeout(() => setStep(4), 800);
      })
      .catch(() => {
        // AI 분석 BE 미구현 - 테스트용 데이터로 Step4 진행
        clearInterval(t);
        setAnalysisResult(MOCK_ANALYSIS_RESULT);
        setAnalyzeStep(ANALYZE_STEPS.length + 1);
        setAnalyzeProgress(100);
        setTimeout(() => setStep(4), 800);
      });

    return () => clearInterval(t);
  }, [step, sessionId, analyzeKey]);

  const handleReset = () => {
    uploadedImageIds.current = [];
    progressRef.current = 0;
    completedCountRef.current = 0;
    setStep(1);
    setPhase('white');
    setProgress(0);
    setIsPaused(false);
    setIsCapturing(false);
    setCurrentZoneIdx(0);
    setCompletedZones([]);
    setChecked(false);
    setAnalyzeStep(0);
    setAnalyzeProgress(0);
    setSessionId(null);
    setAnalysisResult(null);
    setAnalyzeError(null);
    setAnalyzeKey(0);
    progressRef.current = 0;
    completedCountRef.current = 0;
    capturedZonesRef.current = new Set();
  };

  return (
    <div>
      {step === 1 && (
        <Step1
          checked={checked}
          onCheck={setChecked}
          onExit={() => setShowExitModal(true)}
          onStart={async () => {

            if (!deviceId) {
              console.error('기기가 등록되지 않았습니다');
              return;
            }
            try {
              const res = await scanApi.createSession({ userId: 1, deviceId });
              const sid = res.data.result;
              setSessionId(sid);
              setStep(2);
              setCurrentZoneIdx(0);
              setCompletedZones([]);
              setProgress(0);
              uploadedImageIds.current = [];
            } catch (e) {
              console.error('세션 생성 실패:', e);
            }
          }}
        />
      )}
      {step === 2 && (
        <Step2
          videoRef={videoRef}
          imgRef={imgRef}
          isReady={isReady}
          cameraError={cameraError}
          cameraMode={cameraMode}
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
          onCapture={handleCapture}
          isCapturing={isCapturing}
          onLightToggle={toggleLight}
          onCameraFlip={flipCamera}
          onRetry={() => {
            stopCamera();
            if (deviceIp) {
              startCamera('esp32', `http://${deviceIp}/stream`);
            } else {
              startCamera('device');
            }
          }}
        />
      )}
      {step === 3 && (
        <Step3
          analyzeStep={analyzeStep}
          analyzeProgress={analyzeProgress}
          analyzeError={analyzeError}
          onRetry={() => {
            setAnalyzeError(null);
            setAnalyzeStep(0);
            setAnalyzeProgress(0);
            setAnalyzeKey((k) => k + 1);
          }}
          onReset={handleReset}
        />
      )}
      {step === 4 && (
        <Step4
          onNext={() => router.push(`/report/${sessionId}`)}
          onReset={handleReset}
          analysisResult={analysisResult}
        />
      )}

      {showExitModal && (
        <ScanExitModal onCancel={() => setShowExitModal(false)} onConfirm={() => router.back()} />
      )}
      {showHelp && <ScanHelpSheet onClose={() => setShowHelp(false)} />}
    </div>
  );
}
