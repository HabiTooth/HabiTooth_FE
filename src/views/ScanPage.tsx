'use client';

import { useState, useEffect, useRef, useCallback, useMemo, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { X, HelpCircle, Check, CheckCircle2, Lock, Loader2, AlertTriangle, Sun, Camera, Bell, User } from 'lucide-react';
import type { ScanStatusType } from '@/components/molecules/ScanStatusBanner';
import { useCameraStream, type CameraMode } from '@/hooks/useCameraStream';
import { useScanDetection } from '@/hooks/useScanDetection';
import { scanApi, type ViewType, type SessionAnalyzeResult } from '@/lib/api/scan';
import { evaluateCaptureBlob, type CaptureQuality } from '@/lib/imageQuality';
import { useAuthStore } from '@/stores/authStore';
import {
  SCAN_ZONES,
  ALL_VIEW_TYPES,
  ZONE_GROUP_ORDER,
  GROUP_LABELS,
  zonesOfGroup,
  estimateMinutes,
  type ScanZone,
} from '@/constants/scanZones';
import SandRevealImage from '@/components/atoms/SandRevealImage';
import ToothIcon from '@/components/atoms/ToothIcon';
import GuideItem from '@/components/molecules/GuideItem';
import ToothArchSelector, { type Surface } from '@/components/molecules/ToothArchSelector';
import CameraView from '@/components/organisms/CameraView';
import CaptureReview from '@/components/organisms/CaptureReview';
import ScanExitModal from '@/components/organisms/ScanExitModal';
import ScanHelpSheet from '@/components/organisms/ScanHelpSheet';
import Checkbox from '@/components/atoms/Checkbox';

type Step = 1 | 2 | 3 | 4;
type ScanPhase = 'guide' | 'white' | 'uv';

const ANALYZE_STEPS = [
  '이미지 품질 확인',
  '치태 의심 영역 탐지',
  '치석 가능 부위 분석',
  '구강 건강 지수 계산',
  '맞춤 리포트 생성',
];

const DEV_SESSION_ID = -1;
const isDev = process.env.NODE_ENV === 'development';
const WEBCAM_KEY = 'dev.useWebcam';

const zoneInfo = (viewType: ViewType | null): ScanZone | undefined =>
  viewType ? SCAN_ZONES.find((z) => z.viewType === viewType) : undefined;

const sortZones = (picked: ViewType[]): ViewType[] => {
  const set = new Set(picked);
  return SCAN_ZONES.filter((z) => set.has(z.viewType)).map((z) => z.viewType);
};

// BE AI 분석 구현 전까지 쓰는 테스트용 데이터
const mockScore = (v: ViewType) => 68 + ((v.length * 7 + v.charCodeAt(0)) % 25);
const mockAnalysisResult = (zones: ViewType[]): SessionAnalyzeResult => {
  const scores = zones.map(mockScore);
  return {
    sessionId: 0,
    sessionScore: Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1)),
    validZoneCount: zones.length,
    totalZoneCount: zones.length,
    invalidZones: [],
    failedCount: 0,
    analysisResults: zones.map((viewType, i) => ({
      analysisResultId: i + 1,
      scanImageId: i + 1,
      viewType,
      status: 'COMPLETED',
      zoneScore: scores[i],
      zoneValid: true,
      detectedToothCount: 8,
      scoreVersion: 'mock',
      totalCalculusRatio: 0,
      totalPlaqueRatio: 0,
      toothStatuses: [],
    })),
  };
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

function ZoneChips({
  selectedZones,
  onToggleZone,
}: {
  selectedZones: ViewType[];
  onToggleZone: (z: ViewType) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {ZONE_GROUP_ORDER.map((group) => {
        const zones = zonesOfGroup(group);
        const on = zones.filter((z) => selectedZones.includes(z.viewType)).length;
        return (
          <div key={group} className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[12px] font-bold text-content">{GROUP_LABELS[group]}</span>
              <span className="text-[11px] font-semibold text-muted tabular-nums">
                {on}/{zones.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {zones.map(({ viewType, label }) => {
                const active = selectedZones.includes(viewType);
                return (
                  <button
                    key={viewType}
                    type="button"
                    onClick={() => onToggleZone(viewType)}
                    aria-pressed={active}
                    className={`rounded-[12px] px-2 py-2 border-[1.5px] transition-colors text-left ${
                      active ? 'border-primary bg-primary/5' : 'border-hairline bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span
                        className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center flex-shrink-0 ${
                          active ? 'bg-primary border-primary' : 'bg-white border-hairline'
                        }`}
                      >
                        {active && <Check size={9} className="text-white" strokeWidth={3.5} />}
                      </span>
                      <span
                        className={`text-[11.5px] font-bold leading-tight break-keep ${
                          active ? 'text-primary' : 'text-content'
                        }`}
                      >
                        {label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Step1({
  checked,
  onCheck,
  onExit,
  onStart,
  selectedZones,
  onToggleZone,
  webcam,
}: {
  checked: boolean;
  onCheck: (v: boolean) => void;
  onExit: () => void;
  onStart: () => void;
  webcam: { on: boolean; onToggle: (v: boolean) => void } | null;
  selectedZones: ViewType[];
  onToggleZone: (z: ViewType) => void;
}) {
  const count = selectedZones.length;

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

      <div
        className="relative flex-shrink-0 h-[164px] overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #3D58E8 0%, #5B7CF5 55%, #8AA4FF 100%)' }}
      >
        <div
          className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        <div
          className="absolute -left-12 -bottom-14 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: 'rgba(103,232,249,0.07)' }}
        />

        <svg style={{ position: 'absolute', top: 16, left: 26, animation: 'sparkle-twinkle 2.1s ease-in-out infinite' }} width="10" height="10" viewBox="0 0 12 12">
          <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.7" />
        </svg>
        <svg style={{ position: 'absolute', bottom: 30, left: 44, animation: 'sparkle-twinkle 1.7s ease-in-out 0.5s infinite' }} width="7" height="7" viewBox="0 0 12 12">
          <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.45" />
        </svg>

        <div className="px-5 pt-5 pr-[38%] flex flex-col gap-1.5 relative z-10">
          <h1 className="m-0 text-white font-bold leading-tight" style={{ fontSize: '25px' }}>
            실시간 구강 스캔
          </h1>
          <p className="m-0 text-white/80 leading-relaxed" style={{ fontSize: '12.5px' }}>
            찍고 싶은 구역만 골라
            <br />
            원하는 순서로 촬영하세요.
          </p>
        </div>

        <div style={{ position: 'absolute', top: 0, right: 2, width: 152, height: 152 }}>
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
              width: '116%',
              height: '116%',
              top: '-8%',
              left: '-8%',
              border: '1.5px solid rgba(255,255,255,0.22)',
              borderRadius: '50%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                background: 'rgba(103,232,249,0.95)',
                borderRadius: '50%',
                top: '8%',
                left: '72%',
                boxShadow: '0 0 10px rgba(103,232,249,0.9)',
              }}
            />
          </div>
          <svg style={{ position: 'absolute', top: '4%', right: '0%', animation: 'sparkle-twinkle 1.6s ease-in-out infinite' }} width="12" height="12" viewBox="0 0 12 12">
            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8Z" fill="white" opacity="0.95" />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/tooth-3.png"
            alt=""
            style={{
              width: 134,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              filter:
                'drop-shadow(0 8px 28px rgba(75,123,245,0.55)) drop-shadow(0 0 20px rgba(103,232,249,0.4))',
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-t-[28px] -mt-6 relative z-10 flex flex-col">
        <div className="px-5 pt-5 pb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="m-0 text-[15px] font-bold text-content">촬영할 구역 고르기</p>
                <p className="m-0 mt-0.5 text-[11px] text-muted">여러 구역을 함께 고를 수 있어요</p>
              </div>
              <span className="text-[12px] font-bold text-primary whitespace-nowrap">
                {count}구역 · 약 {estimateMinutes(count)}분
              </span>
            </div>

            <ZoneChips selectedZones={selectedZones} onToggleZone={onToggleZone} />

            {count === 0 && (
              <p className="m-0 text-[12px] text-danger font-medium text-center">
                최소 한 구역은 선택해 주세요.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-hairline pt-4">
            <GuideItem
              icon={<Camera size={18} className="text-primary" />}
              text="카메라를 치아 가까이 가져가세요"
              sub="5~10cm 거리를 유지해 주세요."
            />
            <GuideItem
              icon={<AlertTriangle size={18} className="text-warning" />}
              text="흔들리지 않게 천천히 움직여 주세요"
              sub="촬영 후 흔들렸는지 바로 확인할 수 있어요."
            />
            <GuideItem
              icon={<Sun size={18} className="text-success" />}
              text="빛 반사 없이 각도를 조절하세요"
              sub="과도한 반사는 분석을 방해해요."
            />
          </div>
          <div className="border-t border-hairline pt-4">
            <Checkbox
              checked={checked}
              onChange={onCheck}
              label="위 안내를 모두 확인했어요"
            />
          </div>

          {webcam && (
            <div className="border-t border-dashed border-hairline pt-4">
              <Checkbox
                checked={webcam.on}
                onChange={webcam.onToggle}
                label="개발용: 스캐너 대신 웹캠으로 촬영"
              />
              <p className="m-0 mt-1 ml-7 text-[11px] text-muted">
                노트북·휴대폰 카메라로 흐름만 확인할 때 써요.
              </p>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 px-5 pt-3 pb-5 bg-white/95 backdrop-blur-sm border-t border-hairline">
          <button
            type="button"
            onClick={onStart}
            disabled={!checked || count === 0}
            className="w-full h-[52px] rounded-[14px] text-white text-[16px] font-semibold
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
  lightOn,
  selectedZones,
  capturedZones,
  currentZone,
  surface,
  onSurfaceChange,
  onZoneClick,
  onExit,
  onHelp,
  onCapture,
  isCapturing,
  onLightToggle,
  onCameraFlip,
  onRetry,
  onFinish,
  reviewOverlay,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  imgRef: RefObject<HTMLImageElement | null>;
  isReady: boolean;
  cameraError: string | null;
  cameraMode: CameraMode;
  phase: ScanPhase;
  status: ScanStatusType;
  lightOn: boolean;
  selectedZones: ViewType[];
  capturedZones: ViewType[];
  currentZone: ViewType | null;
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  onZoneClick: (z: ViewType) => void;
  onExit: () => void;
  onHelp: () => void;
  onCapture: () => void;
  isCapturing: boolean;
  onLightToggle: () => void;
  onCameraFlip: () => void;
  onRetry: () => void;
  onFinish: () => void;
  reviewOverlay?: React.ReactNode;
}) {
  const info = zoneInfo(currentZone);
  const done = capturedZones.length;
  const total = selectedZones.length;
  const allDone = done >= total;

  return (
    <div className="max-w-[430px] mx-auto h-svh flex flex-col">
      <PageHeader title="실시간 구강 스캔" onExit={onExit} onHelp={onHelp} />

      <div className="bg-white px-3 pt-2 pb-2 flex-shrink-0 border-b border-hairline">
        <ToothArchSelector
          compact
          lockUnselected
          surface={surface}
          onSurfaceChange={onSurfaceChange}
          selected={selectedZones}
          captured={capturedZones}
          current={currentZone}
          onZoneClick={onZoneClick}
        />
        <div className="flex items-center justify-between px-1 mt-0.5">
          <span className="text-[13px] font-bold text-content truncate">
            {info ? info.fullLabel : '구역을 선택하세요'}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[12px] font-bold text-muted tabular-nums">
              {done}/{total}
            </span>
            {allDone && (
              <button
                type="button"
                onClick={onFinish}
                className="px-3 py-1 rounded-full bg-primary text-white text-[11px] font-bold"
              >
                분석 시작
              </button>
            )}
          </div>
        </div>
      </div>

      <CameraView
        videoRef={videoRef}
        imgRef={imgRef}
        isReady={isReady}
        cameraError={cameraError}
        cameraMode={cameraMode}
        phase={phase}
        lightOn={lightOn}
        status={status}
        onLightToggle={onLightToggle}
        onCameraFlip={onCameraFlip}
        onCapture={onCapture}
        isCapturing={isCapturing}
        onRetry={onRetry}
        reviewOverlay={reviewOverlay}
      />
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
  capturedZones,
}: {
  onNext: () => void;
  onReset: () => void;
  analysisResult: SessionAnalyzeResult | null;
  capturedZones: ViewType[];
}) {
  const [showCheck, setShowCheck] = useState(false);
  const [surface, setSurface] = useState<Surface>('LINGUAL');

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
            {capturedZones.length}개 구역 스캔이 모두 완료됐어요.
            <br />
            AI 분석이 완료되었어요.
          </p>
          {analysisResult && (
            <div className="mt-4 text-center">
              <div className="text-[14px] font-semibold text-content mb-1">건강도 점수</div>
              {analysisResult.sessionScore === null ? (
                <p className="m-0 text-[13px] text-muted">점수를 낼 수 있는 컷이 없었어요.</p>
              ) : (
                <>
                  <div className="text-[28px] font-bold text-primary">
                    {analysisResult.sessionScore}
                  </div>
                  <p className="m-0 text-[11px] text-muted">
                    {analysisResult.validZoneCount}개 구역 기준
                  </p>
                </>
              )}
            </div>
          )}

          {analysisResult && analysisResult.invalidZones.length > 0 && (
            <p className="m-0 mt-3 text-[12px] text-warning break-keep">
              {analysisResult.invalidZones.map((z) => zoneInfo(z)?.label ?? z).join(', ')} 구역은
              다시 찍는 걸 추천해요.
            </p>
          )}
        </div>

        <div className="w-full bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card px-4 pt-3.5 pb-3">
          <p className="m-0 text-[11px] font-bold text-muted uppercase tracking-widest mb-1">
            스캔 완료 구역
          </p>
          <ToothArchSelector
            surface={surface}
            onSurfaceChange={setSurface}
            selected={capturedZones}
            captured={capturedZones}
            onZoneClick={() => {}}
          />
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

interface PendingShot {
  zone: ViewType;
  blob: Blob;
  previewUrl: string;
  quality: CaptureQuality;
}

export default function ScanPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedZones, setSelectedZones] = useState<ViewType[]>(ALL_VIEW_TYPES);
  const [capturedZones, setCapturedZones] = useState<ViewType[]>([]);
  const [currentZone, setCurrentZone] = useState<ViewType | null>(null);
  const [surface, setSurface] = useState<Surface>('LINGUAL');
  const [pending, setPending] = useState<PendingShot | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SessionAnalyzeResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeKey, setAnalyzeKey] = useState(0);

  const phase: ScanPhase = 'white';

  const { deviceId, deviceIp } = useAuthStore();
  const [useWebcam, setUseWebcam] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(WEBCAM_KEY);
    setUseWebcam(stored !== null ? stored === 'true' : !deviceIp);
  }, [deviceIp]);

  const toggleWebcam = useCallback((next: boolean) => {
    localStorage.setItem(WEBCAM_KEY, String(next));
    setUseWebcam(next);
  }, []);
  const uploadedImageIds = useRef<Map<ViewType, number>>(new Map());
  const pendingRef = useRef<PendingShot | null>(null);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

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

  const { detectedStatus } = useScanDetection({
    videoRef,
    enabled: step === 2 && isReady && !pending,
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
      if (deviceIp && !useWebcam) {
        startCameraRef.current('esp32', `http://${deviceIp}/stream`);
      } else {
        startCameraRef.current('device');
      }
    } else {
      stopCameraRef.current();
    }
  }, [step, deviceIp, useWebcam]);

  useEffect(() => () => {
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.previewUrl);
  }, []);

  useEffect(() => {
    const g = zoneInfo(currentZone)?.group;
    if (g) setSurface(g === 'OUTER' ? 'BUCCAL' : 'LINGUAL');
  }, [currentZone]);

  const captureBlob = useCallback(async (): Promise<Blob> => {
    if (cameraMode === 'esp32' && deviceIp) {
      const host = deviceIp.split(':')[0];
      const res = await fetch(`/api/camera/capture?ip=${host}`);
      if (!res.ok) throw new Error('capture proxy failed');
      return res.blob();
    }
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video?.videoWidth || 640;
    canvas.height = video?.videoHeight || 480;
    if (video) canvas.getContext('2d')?.drawImage(video, 0, 0);
    return new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/jpeg', 0.9),
    );
  }, [cameraMode, deviceIp, videoRef]);

  const handleCapture = useCallback(async () => {
    if (isCapturing || !isReady || !currentZone || pending) return;
    setIsCapturing(true);
    setCaptureError(null);
    try {
      const blob = await captureBlob();
      const quality = await evaluateCaptureBlob(blob);
      setPending({ zone: currentZone, blob, previewUrl: URL.createObjectURL(blob), quality });
    } catch {
      setCaptureError('촬영에 실패했어요. 카메라 연결을 확인해 주세요.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, isReady, currentZone, pending, captureBlob]);

  const handleRetake = useCallback(() => {
    setPending((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setCaptureError(null);
  }, []);

  const nextUncapturedZone = useCallback(
    (justDone: ViewType) => {
      const done = new Set([...capturedZones, justDone]);
      const order = selectedZones;
      const from = order.indexOf(justDone);
      for (let k = 1; k <= order.length; k++) {
        const z = order[(from + k) % order.length];
        if (!done.has(z)) return z;
      }
      return null;
    },
    [capturedZones, selectedZones],
  );

  const handleConfirmShot = useCallback(async () => {
    if (!pending || !sessionId) return;
    setIsUploading(true);
    setCaptureError(null);
    const { zone, blob, previewUrl } = pending;
    try {
      if (sessionId !== DEV_SESSION_ID) {
        const file = new File([blob], `scan_${zone}.jpg`, { type: 'image/jpeg' });
        const res = await scanApi.uploadImageToSession(sessionId, {
          file,
          viewType: zone,
          lightType: 'WHITE_LIGHT',
        });
        uploadedImageIds.current.set(zone, res.data.result.imageId);
      }

      URL.revokeObjectURL(previewUrl);
      setPending(null);

      const isRetake = capturedZones.includes(zone);
      setCapturedZones((prev) => (prev.includes(zone) ? prev : [...prev, zone]));

      const next = nextUncapturedZone(zone);
      if (next) setCurrentZone(next);
      else if (!isRetake) setTimeout(() => setStep(3), 400);
    } catch {
      setCaptureError('업로드에 실패했어요. 네트워크를 확인하고 다시 시도해 주세요.');
    } finally {
      setIsUploading(false);
    }
  }, [pending, sessionId, nextUncapturedZone, capturedZones]);

  const handleToggleZone = useCallback((z: ViewType) => {
    setSelectedZones((prev) =>
      sortZones(prev.includes(z) ? prev.filter((v) => v !== z) : [...prev, z]),
    );
  }, []);

  const handleNavigateZone = useCallback((z: ViewType) => {
    if (pending) return;
    setCurrentZone(z);
    setCaptureError(null);
  }, [pending]);

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
      .then((res: { data: { result: SessionAnalyzeResult } }) => {
        setAnalysisResult(res.data.result);
        clearInterval(t);
        setAnalyzeStep(ANALYZE_STEPS.length + 1);
        setAnalyzeProgress(100);
        setTimeout(() => setStep(4), 800);
      })
      .catch(() => {
        // AI 분석 BE 미구현 - 테스트용 데이터로 Step4 진행
        clearInterval(t);
        setAnalysisResult(mockAnalysisResult(capturedZones));
        setAnalyzeStep(ANALYZE_STEPS.length + 1);
        setAnalyzeProgress(100);
        setTimeout(() => setStep(4), 800);
      });

    return () => clearInterval(t);
  }, [step, sessionId, analyzeKey, capturedZones]);

  const handleReset = () => {
    uploadedImageIds.current = new Map();
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    setStep(1);
    setSelectedZones(ALL_VIEW_TYPES);
    setCapturedZones([]);
    setCurrentZone(null);
    setSurface('LINGUAL');
    setIsCapturing(false);
    setIsUploading(false);
    setCaptureError(null);
    setChecked(false);
    setAnalyzeStep(0);
    setAnalyzeProgress(0);
    setSessionId(null);
    setAnalysisResult(null);
    setAnalyzeError(null);
    setAnalyzeKey(0);
  };

  const reviewOverlay = useMemo(() => {
    if (!pending) return undefined;
    const remaining = selectedZones.filter(
      (z) => z !== pending.zone && !capturedZones.includes(z),
    ).length;
    const confirmLabel = capturedZones.includes(pending.zone)
      ? '이 컷으로 교체'
      : remaining === 0
        ? '이대로 완료'
        : '이대로 다음';
    return (
      <CaptureReview
        previewUrl={pending.previewUrl}
        quality={pending.quality}
        zoneLabel={zoneInfo(pending.zone)?.fullLabel ?? ''}
        isUploading={isUploading}
        uploadError={captureError}
        confirmLabel={confirmLabel}
        onRetake={handleRetake}
        onConfirm={handleConfirmShot}
      />
    );
  }, [pending, selectedZones, capturedZones, isUploading, captureError, handleRetake, handleConfirmShot]);

  return (
    <div>
      {step === 1 && (
        <Step1
          checked={checked}
          onCheck={setChecked}
          selectedZones={selectedZones}
          onToggleZone={handleToggleZone}
          webcam={isDev ? { on: useWebcam, onToggle: toggleWebcam } : null}
          onExit={() => setShowExitModal(true)}
          onStart={async () => {
            if (!deviceId && !isDev) {
              console.error('기기가 등록되지 않았습니다');
              return;
            }
            const enterScan = (sid: number) => {
              setSessionId(sid);
              uploadedImageIds.current = new Map();
              setCapturedZones([]);
              setCurrentZone(selectedZones[0] ?? null);
              setStep(2);
            };
            try {
              const res = await scanApi.createSession(deviceId ?? 0);
              enterScan(res.data.result);
            } catch (e) {
              console.error('세션 생성 실패:', e);
              if (isDev) {
                console.warn('개발 모드: 업로드 없이 스캔 화면만 띄웁니다');
                enterScan(DEV_SESSION_ID);
              }
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
          lightOn={lightOn}
          selectedZones={selectedZones}
          capturedZones={capturedZones}
          currentZone={currentZone}
          surface={surface}
          onSurfaceChange={setSurface}
          onZoneClick={handleNavigateZone}
          onExit={() => setShowExitModal(true)}
          onHelp={() => setShowHelp(true)}
          onCapture={handleCapture}
          isCapturing={isCapturing}
          onLightToggle={toggleLight}
          onCameraFlip={flipCamera}
          onFinish={() => setStep(3)}
          onRetry={() => {
            stopCamera();
            if (deviceIp && !useWebcam) {
              startCamera('esp32', `http://${deviceIp}/stream`);
            } else {
              startCamera('device');
            }
          }}
          reviewOverlay={reviewOverlay}
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
          capturedZones={capturedZones}
        />
      )}

      {showExitModal && (
        <ScanExitModal onCancel={() => setShowExitModal(false)} onConfirm={() => router.back()} />
      )}
      {showHelp && <ScanHelpSheet onClose={() => setShowHelp(false)} />}
    </div>
  );
}
