'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Brush, Scissors, Calendar, ChevronLeft } from 'lucide-react';
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

const CARE_ICONS = [
  <Brush key="brush" size={20} className="text-[#4A86D9]" />,
  <Scissors key="scissors" size={20} className="text-[#4A86D9]" />,
  <Calendar key="calendar" size={20} className="text-[#4A86D9]" />,
];

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

    setLlmLoading(true);
    setLlmFailed(false);
    reportApi
      .generateLlmReport(sessionId)
      .then((res) => setLlm(res.data.result))
      .catch(() => setLlmFailed(true))
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

  // 한 치아에 치태·치석 행이 따로 오기 때문에 치아별로 제일 나쁜 등급만 남김
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

  const careGuideItems = (llm?.management ?? []).map((m, i) => ({
    icon: CARE_ICONS[i % CARE_ICONS.length],
    title: m.title,
    description: m.detail,
  }));

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
