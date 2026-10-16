'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import OralViewer3D from '@/components/organisms/OralViewer3D';
import type { ToothAnalysisResult } from '@/components/organisms/OralViewer3D/ThreeScene';
import type { SurfaceType, ToothLesion } from '@/lib/api/report';
import type { LesionType } from '@/lib/api/common';
import type { MarkerVisibility } from '@/components/organisms/OralViewer3D/ThreeScene';
import type { ToothStateCounts } from '@/lib/lesionState';
import { LESION_LABEL, RISK_TAG } from '@/lib/lesionRisk';
import { MARKER_FILL, RISK_MODEL_FILL } from '@/lib/riskColors';
import type { RiskLevel } from '@/lib/api/common';
import { scoreDiffText, scoreGrade, scoreStatus } from '@/lib/score';
import type { FocusChip, ToothDetail } from '@/lib/toothDetail';

interface ReportHeroProps {
  date: string;
  score: number | null;
  prevScore?: number;
  // 모형 아래 말풍선 한 줄. 없으면 안 그린다
  message?: string | null;
  counts: ToothStateCounts;
  analysisResults: ToothAnalysisResult[];
  lesions: ToothLesion[];
  scannedTeeth: number[];
  // 위험한 순서의 신경 쓸 치아
  focusTeeth: FocusChip[];
  selected: string | null;
  detail: ToothDetail | null;
  // AI 리포트 중 이 치아를 짚은 항목
  aiNote?: { title: string; description: string } | null;
  onSelect: (fdi: string | null) => void;
  onBack: () => void;
}

// 포인터를 따라 움직이는 빛. 멀리 있는 것일수록 적게 움직인다
const FOLLOW = { glow: 220, aurora1: 90, aurora2: -110 };

const CHANGE_LABEL = { better: '좋아짐', worse: '나빠짐', same: '그대로', first: '첫 기록' };
const SURFACE_LABEL: Record<SurfaceType, string> = { OUTER: '바깥쪽', INNER: '안쪽' };

interface FocusView {
  key: string;
  label: string;
  lesionType: LesionType;
  surface: SurfaceType;
}

// 고른 치아에 병변이 여러 면·여러 종류로 있으면 하나씩 골라 볼 수 있게 보기 목록을 만든다
function focusViews(lesions: ToothLesion[], fdi: string | null): FocusView[] {
  if (!fdi) return [];
  const own = lesions.filter((l) => String(l.toothNumber) === fdi && l.polygon.length >= 3);
  const seen = new Map<string, FocusView>();
  // 치석을 앞에, 같은 종류면 바깥쪽을 앞에
  const order = (l: ToothLesion) =>
    (l.lesionType === 'CALCULUS' ? 0 : 10) + (l.surfaceType === 'OUTER' ? 0 : 1);
  [...own]
    .sort((a, b) => order(a) - order(b))
    .forEach((l) => {
      const key = `${l.lesionType}:${l.surfaceType}`;
      if (!seen.has(key)) {
        seen.set(key, { key, label: '', lesionType: l.lesionType, surface: l.surfaceType });
      }
    });
  const views = [...seen.values()];
  if (views.length < 2) return [];
  const types = new Set(views.map((v) => v.lesionType)).size;
  const surfaces = new Set(views.map((v) => v.surface)).size;
  return views.map((v) => ({
    ...v,
    // 종류만 다르면 "치석 보기", 면만 다르면 "안쪽 보기", 둘 다 섞이면 "치석 · 안쪽"
    label:
      types > 1 && surfaces > 1
        ? `${LESION_LABEL[v.lesionType]} · ${SURFACE_LABEL[v.surface]}`
        : types > 1
          ? `${LESION_LABEL[v.lesionType]} 보기`
          : `${SURFACE_LABEL[v.surface]} 보기`,
  }));
}

// 등급 배지. 파란 바탕 위라 채운 색으로 구분한다
const GRADE_BADGE: Record<string, string> = {
  A: 'bg-success text-white',
  B: 'bg-white text-primary',
  C: 'bg-warning text-[#5A3D00]',
  D: 'bg-warning text-[#5A3D00]',
  F: 'bg-danger text-white',
};

// 모형 색 안내. 치아 색이 뜻하는 단계
const LEGEND: RiskLevel[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const UNSCANNED_COLOR = '#C7C7CC';

export default function ReportHero({
  date,
  score,
  prevScore,
  message,
  counts,
  analysisResults,
  lesions,
  scannedTeeth,
  focusTeeth,
  selected,
  detail,
  aiNote,
  onSelect,
  onBack,
}: ReportHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  // 전체 보기일 때 히어로 높이. 확대해도 카드 높이가 안 바뀌게 무대를 이 높이로 채운다
  // 점수·범례가 나중에 채워지며 높이가 자라니 전체 보기 동안 계속 잰다
  const [heroHeight, setHeroHeight] = useState<number | null>(null);
  const idleRef = useRef(!detail);
  idleRef.current = !detail;

  const views = useMemo(() => focusViews(lesions, selected), [lesions, selected]);
  const [viewKey, setViewKey] = useState<string | null>(null);
  useEffect(() => setViewKey(null), [selected]);
  const activeView = views.find((v) => v.key === viewKey) ?? views[0] ?? null;
  // 보기를 골랐으면 그 종류 마커만. 종류가 하나뿐이면 전부
  const markerFilter = useMemo<MarkerVisibility | undefined>(() => {
    if (!activeView || new Set(views.map((v) => v.lesionType)).size < 2) return undefined;
    return { PLAQUE: activeView.lesionType === 'PLAQUE', CALCULUS: activeView.lesionType === 'CALCULUS' };
  }, [activeView, views]);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (idleRef.current) setHeroHeight(el.offsetHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const glowRef = useRef<HTMLDivElement>(null);
  const aurora1Ref = useRef<HTMLSpanElement>(null);
  const aurora2Ref = useRef<HTMLSpanElement>(null);

  // 리렌더 없이 빛만 옮긴다. 가운데가 0, 가장자리가 ±0.5
  const follow = (x: number, y: number) => {
    const move = (el: HTMLElement | null, amount: number) => {
      if (el) el.style.transform = `translate(${x * amount}px, ${y * amount}px)`;
    };
    move(glowRef.current, FOLLOW.glow);
    move(aurora1Ref.current, FOLLOW.aurora1);
    move(aurora2Ref.current, FOLLOW.aurora2);
  };
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    follow(
      (event.clientX - rect.left) / rect.width - 0.5,
      (event.clientY - rect.top) / rect.height - 0.5,
    );
  };
  const release = () => follow(0, 0);

  const diff = score !== null && prevScore !== undefined ? score - prevScore : null;
  const scoreLine = [
    score !== null ? scoreStatus(score) : null,
    diff !== null ? scoreDiffText(diff) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const countLine = [
    `치석 ${counts.calculus}`,
    `치태 ${counts.plaque}`,
    `깨끗 ${counts.clean}`,
    counts.unscanned > 0 ? `미촬영 ${counts.unscanned}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const index = selected ? focusTeeth.findIndex((t) => t.fdi === selected) : -1;
  const step = (delta: number) => {
    if (focusTeeth.length === 0) return;
    const next = index < 0 ? 0 : (index + delta + focusTeeth.length) % focusTeeth.length;
    onSelect(focusTeeth[next].fdi);
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={release}
      onPointerCancel={release}
      className="relative overflow-hidden rounded-b-[28px] bg-[linear-gradient(170deg,#3F7BD1_0%,#4A86D9_45%,#5C97E4_100%)] text-white"
    >
      {/* 앱 배경과 같은 오로라. 바깥 span은 느리게 흐르고 안쪽 span은 포인터를 따라온다 */}
      <span
        aria-hidden
        className="hero-aurora-1 pointer-events-none absolute -left-20 top-4 block h-80 w-80"
      >
        <span
          ref={aurora1Ref}
          className="block h-full w-full rounded-full bg-[#67E8F9] opacity-50 blur-3xl transition-transform duration-700 ease-out"
        />
      </span>
      <span
        aria-hidden
        className="hero-aurora-2 pointer-events-none absolute -right-24 bottom-16 block h-96 w-96"
      >
        <span
          ref={aurora2Ref}
          className="block h-full w-full rounded-full bg-[#A78BFA] opacity-50 blur-3xl transition-transform duration-700 ease-out"
        />
      </span>
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_62%)] transition-transform duration-500 ease-out"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0)_100%)]"
      />

      {!detail && (
        <header className="relative z-10 flex items-center px-4 pb-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로 가기"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="m-0 text-[16px] font-semibold">분석 리포트</h1>
            {date && <p className="m-0 mt-1 text-[13px] font-medium text-white/85">{date} 스캔</p>}
          </div>
          <div className="w-9" />
        </header>
      )}

      {/* 모형 무대. 치아를 고르면 글자가 모형 위에 얹힌다 */}
      <div
        className={`relative ${detail ? '' : 'h-[380px]'}`}
        style={detail ? { height: heroHeight ?? 520 } : undefined}
      >
        <OralViewer3D
          analysisResults={analysisResults}
          lesions={lesions}
          scannedTeeth={scannedTeeth}
          minimal
          zoom={1.22}
          idleMarkers={false}
          selectedTooth={selected}
          focusSurface={activeView?.surface ?? null}
          visibleMarkers={markerFilter}
          onToothSelect={onSelect}
        />

        {detail && (
          <div key={detail.fdi} className="hero-rise pointer-events-none absolute inset-0 z-10">
            {/* 글자 뒤 어두운 그라데이션. 아티클 상단 이미지와 같은 결 */}
            <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#17213F]/70 via-[#17213F]/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#17213F]/75 via-[#17213F]/30 to-transparent" />

            <div className="absolute right-4 top-4">
              <button
                type="button"
                onClick={() => onSelect(null)}
                aria-label="전체 보기"
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
              >
                <X size={18} />
              </button>
            </div>

            <div className="absolute left-5 top-5 max-w-[60%]">
              <p className="m-0 text-[11px] font-semibold tracking-wider text-white/70">
                FDI {detail.fdi}
              </p>
              <h2 className="m-0 mt-0.5 text-[24px] font-semibold leading-tight [text-shadow:0_1px_12px_rgba(31,64,128,0.35)]">
                {detail.name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-content"
                  style={{
                    backgroundColor: detail.primary
                      ? RISK_MODEL_FILL[detail.primary.riskLevel]
                      : '#E5EDF5',
                  }}
                >
                  {detail.riskLabel}
                </span>
                {detail.rows
                  .filter((row) => row !== detail.primary)
                  .map((row) => (
                    <span
                      key={row.lesionType}
                      className="flex items-center gap-1 rounded-full bg-[#173A73]/45 px-2.5 py-1 text-[12.5px] font-medium"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: MARKER_FILL[row.lesionType] }}
                      />
                      {LESION_LABEL[row.lesionType]} {Math.round(row.areaRatio)}%
                    </span>
                  ))}
                {detail.minor.map((row) => (
                  <span
                    key={`minor-${row.lesionType}`}
                    className="rounded-full bg-[#173A73]/30 px-2.5 py-1 text-[12.5px] font-medium text-white/75"
                  >
                    {LESION_LABEL[row.lesionType]} {Math.round(row.areaRatio)}% · 깨끗 범위
                  </span>
                ))}
                {detail.primary && (
                  <span className="rounded-full bg-[#173A73]/45 px-2.5 py-1 text-[12.5px] font-medium text-white/90">
                    {detail.previousArea !== null
                      ? `${Math.round(detail.previousArea)}% → ${Math.round(detail.primary.areaRatio)}% · ${CHANGE_LABEL[detail.change]}`
                      : CHANGE_LABEL[detail.change]}
                  </span>
                )}
              </div>
            </div>

            {detail.primary && (
              <div className="absolute right-5 top-14 text-right">
                <strong className="block text-[48px] font-bold leading-none tabular-nums tracking-[-1.5px] [text-shadow:0_1px_14px_rgba(31,64,128,0.4)]">
                  {Math.round(detail.primary.areaRatio)}
                  <span className="text-[22px] tracking-normal">%</span>
                </strong>
                <span className="flex items-center justify-end gap-1 text-[12px] text-white/80">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: MARKER_FILL[detail.primary.lesionType] }}
                  />
                  {LESION_LABEL[detail.primary.lesionType]} 면적
                </span>
              </div>
            )}

            <div className="pointer-events-auto absolute bottom-4 left-4 right-4 rounded-2xl bg-[#173A73]/55 p-3 backdrop-blur-[2px]">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="이전 치아"
                  disabled={focusTeeth.length === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[13px] font-medium text-white/85">
                  {index >= 0 ? `${index + 1} / ${focusTeeth.length} 신경 쓸 치아` : '고른 치아'}
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="다음 치아"
                  disabled={focusTeeth.length === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              {views.length > 1 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5" role="group" aria-label="병변 보기">
                  {views.map((v) => {
                    const on = v.key === activeView?.key;
                    return (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setViewKey(v.key)}
                        aria-pressed={on}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                          on ? 'bg-white text-content' : 'bg-white/15 text-white/85'
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: MARKER_FILL[v.lesionType] }}
                        />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              )}
              {aiNote ? (
                <div>
                  <p className="m-0 text-[11px] font-semibold text-white/60">AI 가이드</p>
                  <p className="m-0 mt-0.5 text-[14px] font-semibold leading-snug">
                    {aiNote.title}
                  </p>
                  <p className="m-0 mt-1.5 text-[13.5px] leading-[1.7] text-white/90 break-keep">
                    {aiNote.description}
                  </p>
                </div>
              ) : (
                <p className="m-0 text-[14px] leading-relaxed text-white/95">{detail.tip}</p>
              )}
              {detail.cta && (
                <Link
                  href={detail.cta.href}
                  className={`mt-3 flex h-10 items-center justify-center gap-1 rounded-xl text-[14px] font-semibold no-underline ${
                    detail.primary?.lesionType === 'CALCULUS'
                      ? 'bg-danger text-white'
                      : 'bg-white text-primary'
                  }`}
                >
                  {detail.cta.label}
                  <ChevronRight size={15} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {detail ? null : (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-[#17213F]/60 via-[#17213F]/25 to-transparent" />
          {message && (
            <p className="relative z-10 mx-auto mt-3 w-fit max-w-[88%] rounded-full bg-[#173A73]/60 px-4 py-2 text-center text-[13.5px] font-medium leading-snug">
              {message}
            </p>
          )}

          <div className="relative z-10 px-6 pb-6 pt-4 text-center">
            <div className="flex items-center justify-center gap-2.5">
              {score !== null && (
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold ${
                    GRADE_BADGE[scoreGrade(score)] ?? 'bg-white/20 text-white'
                  }`}
                >
                  {scoreGrade(score)}
                </span>
              )}
              <span className="flex items-baseline gap-1">
                <strong className="text-[52px] font-bold leading-none tabular-nums tracking-[-2px]">
                  {score ?? '–'}
                </strong>
                <span className="text-sm text-white/70">점</span>
              </span>
            </div>
            {scoreLine && <p className="m-0 mt-2.5 text-[13px] text-white/85">{scoreLine}</p>}
            <p className="m-0 mt-1 text-[12px] text-white/65">{countLine}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {LEGEND.map((level) => (
                <span key={level} className="flex items-center gap-1 text-[11.5px] text-white/85">
                  <span
                    className="h-2 w-2 rounded-full border border-white/60"
                    style={{ backgroundColor: RISK_MODEL_FILL[level] }}
                  />
                  {RISK_TAG[level]}
                </span>
              ))}
              {counts.unscanned > 0 && (
                <span className="flex items-center gap-1 text-[11.5px] text-white/85">
                  <span
                    className="h-2 w-2 rounded-full border border-white/60 opacity-60"
                    style={{ backgroundColor: UNSCANNED_COLOR }}
                  />
                  미촬영
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
