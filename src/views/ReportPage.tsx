'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Hospital, Target, Brush, PillBottle, Moon, Apple, ShieldCheck,
  Droplet, RefreshCw, CalendarCheck, SprayCan, ChevronLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import ReportSummary from '@/components/organisms/ReportSummary';
import LLMGuideSection from '@/components/organisms/LLMGuideSection';
import RiskAnalysisSection from '@/components/organisms/RiskAnalysisSection';
import CareGuideSection from '@/components/organisms/CareGuideSection';
import TrendChartSection from '@/components/organisms/TrendChartSection';
import ChangeSummary from '@/components/organisms/ChangeSummary';
import NextStepsSection from '@/components/organisms/NextStepsSection';
import HabitSummarySection from '@/components/organisms/HabitSummarySection';
import type { ToothAnalysisResult } from '@/components/organisms/OralViewer3D/ThreeScene';
import type { GuideItem } from '@/components/organisms/LLMGuideSection/LLMGuideSection.types';
import { reportApi, type LlmReport, type SessionReport } from '@/lib/api/report';
import { historyApi, type HistoryScoreTrendItem } from '@/lib/api/history';
import { formatDate, formatShortDate, scoreStatus, toSummaryRisk } from '@/lib/score';
import { ALL_TEETH } from '@/lib/dentition';
import { useDentitionStore } from '@/stores/dentitionStore';
import { compareTeeth } from '@/lib/compare';
import { useSessionIndex } from '@/hooks/useSessionIndex';
import type { LesionType, RiskLevel } from '@/lib/api/common';

const RISK_ORDER: RiskLevel[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const GUIDE_TYPE: Record<RiskLevel, GuideItem['type']> = {
  VERY_LOW: 'good',
  LOW: 'good',
  MEDIUM: 'warning',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

// 아이콘 렌더링 헬퍼 (lucide + PNG 통일)
const ICON_SIZE = 20;
const ICON_CLASS = 'text-[#4A86D9]';
const renderLucide = (Icon: LucideIcon) => <Icon size={ICON_SIZE} className={ICON_CLASS} />;
const renderPng = (src: string, alt: string) => (
  <Image src={src} alt={alt} width={ICON_SIZE} height={ICON_SIZE} />
);

// 백엔드 MANAGEMENT_CATALOG의 title → 아이콘 매핑
// title은 파이썬 상수라 매칭이 안전함
// 칫솔 / 치실 / 치간칫솔 / 혀 세정은 Flaticon PNG 사용, 나머지는 lucide
const MANAGEMENT_ICONS: Record<string, () => React.ReactNode> = {
  '치과 스케일링':              () => renderLucide(Hospital),
  '집중 부위 칫솔질':           () => renderLucide(Target),
  '올바른 칫솔질 방법':         () => renderPng('/icons/management/toothbrush.png', '칫솔'),
  '치실 사용':                  () => renderPng('/icons/management/dental-floss.png', '치실'),
  '치간칫솔 사용':              () => renderPng('/icons/management/interdental-brush.png', '치간칫솔'),
  '구강세정제 사용':            () => renderLucide(PillBottle),
  '혀 세정':                    () => renderPng('/icons/management/tongue-scraper.png', '혀 세정'),
  '취침 전 칫솔질':             () => renderLucide(Moon),
  '균형 잡힌 식단과 간식 조절': () => renderLucide(Apple),
  '구강 면역력 관리':           () => renderLucide(ShieldCheck),
  '수분 섭취와 구강 건조 관리': () => renderLucide(Droplet),
  '칫솔 관리와 교체':           () => renderLucide(RefreshCw),
  '정기 검진':                  () => renderLucide(CalendarCheck),
  '구강세정기 사용':            () => renderLucide(SprayCan),
};

export default function ReportPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = Number(params?.id);

  const [report, setReport] = useState<SessionReport | null>(null);
  const [llm, setLlm] = useState<LlmReport | null>(null);
  const [llmLoading, setLlmLoading] = useState(true);
  const [llmFailed, setLlmFailed] = useState(false);
  const [llmKey, setLlmKey] = useState(0);
  const [previous, setPrevious] = useState<SessionReport | null>(null);
  const { sessions } = useSessionIndex();
  const { missing, hydrate: hydrateDentition } = useDentitionStore();
  const [trend, setTrend] = useState<HistoryScoreTrendItem[]>([]);

  useEffect(() => hydrateDentition(), [hydrateDentition]);

  useEffect(() => {
    if (!Number.isFinite(sessionId)) return;

    reportApi.getSessionReport(sessionId).then((res) => setReport(res.data.result)).catch(() => {});

    // LLM 리포트: 먼저 GET으로 조회, 저장된 게 없으면 POST로 생성
    setLlmLoading(true);
    setLlmFailed(false);
    reportApi
      .getLlmReport(sessionId)
      .then((res) => setLlm(res.data.result))
      .catch(() =>
        reportApi
          .generateLlmReport(sessionId)
          .then((res) => setLlm(res.data.result))
          .catch(() => setLlmFailed(true))
      )
      .finally(() => setLlmLoading(false));

    historyApi.getScoreTrend().then((res) => setTrend(res.data.result)).catch(() => {});
  }, [sessionId, llmKey]);

  const currentRef = sessions.find((x) => x.sessionId === sessionId) ?? null;
  const previousRef = sessions.find((x) => x.sessionId < sessionId) ?? null;
  const previousId = previousRef?.sessionId ?? null;

  useEffect(() => {
    if (previousId === null) return;
    reportApi
      .getSessionReport(previousId)
      .then((res) => setPrevious(res.data.result))
      .catch(() => setPrevious(null));
  }, [previousId]);

  const diff = useMemo(
    () =>
      compareTeeth(
        (previous?.toothStatuses ?? []).map((t) => ({
          toothNumber: t.toothNumber,
          riskLevel: t.riskLevel,
        })),
        (report?.toothStatuses ?? []).map((t) => ({
          toothNumber: t.toothNumber,
          riskLevel: t.riskLevel,
        })),
      ),
    [previous, report],
  );

  // 한 치아에 치태·치석 둘이 따로 잡히면 치아별로 제일 심한 등급만 씀
  const toothRisks = useMemo(() => {
    const worst = new Map<number, number>();
    for (const t of report?.toothStatuses ?? []) {
      const rank = RISK_ORDER.indexOf(t.riskLevel);
      worst.set(t.toothNumber, Math.max(worst.get(t.toothNumber) ?? 0, rank));
    }
    return [...worst.values()].map((rank) => RISK_ORDER[rank]);
  }, [report]);

  const riskCategories: Array<{ lesionType: LesionType; riskLevel: RiskLevel }> = useMemo(() => {
    const worst = (type: LesionType): RiskLevel => {
      const levels = (report?.toothStatuses ?? [])
        .filter((t) => t.lesionType === type)
        .map((t) => RISK_ORDER.indexOf(t.riskLevel));
      return RISK_ORDER[levels.length > 0 ? Math.max(...levels) : 0];
    };
    return [
      { lesionType: 'PLAQUE', riskLevel: worst('PLAQUE') },
      { lesionType: 'CALCULUS', riskLevel: worst('CALCULUS') },
    ];
  }, [report]);

  const analysisResults: ToothAnalysisResult[] = useMemo(
    () =>
      (report?.toothStatuses ?? []).map((t) => ({
        toothNumber: String(t.toothNumber),
        lesionType: t.lesionType ?? '',
        areaRatio: t.areaRatio,
        riskLevel: t.riskLevel as ToothAnalysisResult['riskLevel'],
      })),
    [report],
  );

  const guideItems: GuideItem[] = (llm?.riskDetail ?? []).map((r) => ({
    type: GUIDE_TYPE[r.riskLevel],
    title: r.title,
    description: r.detail,
  }));

  const careGuideItems = (llm?.management ?? []).map((m) => {
    const renderIcon = MANAGEMENT_ICONS[m.title] ?? (() => renderLucide(Brush));
    if (!MANAGEMENT_ICONS[m.title]) {
      console.warn('[MANAGEMENT_ICONS] 매칭 안 됨:', JSON.stringify(m.title));
    }
    return {
      icon: renderIcon(),
      title: m.title,
      description: m.detail,
    };
  });

  const prevScore = trend.length > 1 ? trend[trend.length - 2].score : undefined;

  return (
    <PageShell withNav>
      <div className="flex items-center px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-hairline">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
        >
          <ChevronLeft size={20} className="text-content" />
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-content">
          분석 리포트
        </span>
        <div className="w-9" />
      </div>

      <main className="px-5 pt-4">
      {report && (
        <ReportSummary
          score={report.totalScore}
          prevScore={prevScore}
          status={scoreStatus(report.totalScore)}
          date={formatDate(currentRef?.scannedAt)}
          teeth={toothRisks}
          totalTeeth={ALL_TEETH.length - missing.length}
          plaqueRisk={toSummaryRisk(riskCategories[0].riskLevel)}
          calculusRisk={toSummaryRisk(riskCategories[1].riskLevel)}
        />
      )}

      <RiskAnalysisSection
        plaque={report?.summary.totalPlaqueRatio ?? 0}
        calculus={report?.summary.totalCalculusRatio ?? 0}
        analysisResults={analysisResults}
      />

      <LLMGuideSection
        items={guideItems}
        isLoading={llmLoading}
        failed={llmFailed}
        onRetry={() => setLlmKey((k) => k + 1)}
      />

      {careGuideItems.length > 0 && <CareGuideSection items={careGuideItems} />}

      <NextStepsSection categories={riskCategories} />

      {llm?.disclaimer && (
        <p className="m-0 mt-3 px-1 text-[11px] leading-relaxed text-gray-400">{llm.disclaimer}</p>
      )}

      <div className="flex items-center gap-3 mt-8 mb-1">
        <div className="flex-1 h-px bg-hairline" />
        <span className="text-[11px] font-bold text-muted">시간에 따른 변화</span>
        <div className="flex-1 h-px bg-hairline" />
      </div>

      <TrendChartSection
        data={trend.map((t) => ({ date: formatShortDate(t.date), score: t.score }))}
      />

      {previous !== null && report !== null && (
        <ChangeSummary
          result={diff}
          scoreDelta={report.totalScore - previous.totalScore}
          previousDate={formatDate(previousRef?.scannedAt)}
        />
      )}

      <HabitSummarySection />

      </main>
      <NavBar activeTab="history" />
    </PageShell>
  );
}