'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Brush, Scissors, Calendar, Loader2, Share2 } from 'lucide-react';
import Header from '@/components/organisms/Header';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import ReportSummary from '@/components/organisms/ReportSummary';
import LLMGuideSection from '@/components/organisms/LLMGuideSection';
import RiskAnalysisSection from '@/components/organisms/RiskAnalysisSection';
import CareGuideSection from '@/components/organisms/CareGuideSection';
import TrendChartSection from '@/components/organisms/TrendChartSection';
import HistoryListSection from '@/components/organisms/HistoryListSection';
import type { ToothAnalysisResult } from '@/components/organisms/OralViewer3D/ThreeScene';
import type { GuideItem } from '@/components/organisms/LLMGuideSection/LLMGuideSection.types';
import { reportApi, type LlmReport, type SessionReport } from '@/lib/api/report';
import { historyApi, type HistoryRecordItem, type HistoryScoreTrendItem } from '@/lib/api/history';
import { dashboardApi } from '@/lib/api/dashboard';
import { renderReportCard, shareOrDownload } from '@/lib/reportExport';
import { formatDate, formatDateTime, formatShortDate, formatTime, scoreGrade, scoreStatus } from '@/lib/score';
import type { RiskLevel } from '@/lib/api/common';

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
  const params = useParams<{ id: string }>();
  const sessionId = Number(params?.id);

  const [report, setReport] = useState<SessionReport | null>(null);
  const [llm, setLlm] = useState<LlmReport | null>(null);
  const [llmLoading, setLlmLoading] = useState(true);
  const [trend, setTrend] = useState<HistoryScoreTrendItem[]>([]);
  const [records, setRecords] = useState<HistoryRecordItem[]>([]);
  const [scannedAt, setScannedAt] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(sessionId)) return;

    reportApi.getSessionReport(sessionId).then((res) => setReport(res.data.result)).catch(() => {});

    reportApi
      .generateLlmReport(sessionId)
      .then((res) => setLlm(res.data.result))
      .catch(() => {})
      .finally(() => setLlmLoading(false));

    historyApi.getScoreTrend().then((res) => setTrend(res.data.result)).catch(() => {});
    historyApi.getRecords().then((res) => setRecords(res.data.result)).catch(() => {});

    dashboardApi
      .getReport()
      .then((res) => {
        const r = res.data.result;
        if (r?.sessionId === sessionId) setScannedAt(formatDateTime(r.scannedAt));
      })
      .catch(() => {});
  }, [sessionId]);

  const handleExport = async () => {
    if (!report || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const blob = await renderReportCard({
        scannedAt,
        score: report.totalScore,
        plaqueRatio: report.summary.totalPlaqueRatio,
        calculusRatio: report.summary.totalCalculusRatio,
        risky: report.toothStatuses
          .filter((t) => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL')
          .map((t) => ({ toothNumber: t.toothNumber, riskLevel: t.riskLevel })),
      });
      await shareOrDownload(blob, `habitooth-${sessionId}.png`);
    } catch {
      setExportError('이미지를 만들지 못했어요. 다시 시도해 주세요.');
    } finally {
      setExporting(false);
    }
  };

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
    <PageShell>
      <main className="p-6 pb-20">
      <Header />

      {report && (
        <ReportSummary
          score={report.totalScore}
          prevScore={prevScore}
          status={scoreStatus(report.totalScore)}
        />
      )}

      {report && (
        <>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full mt-4 h-12 rounded-[14px] bg-white/90 backdrop-blur-sm shadow-card border border-hairline flex items-center justify-center gap-2 text-[13px] font-semibold text-primary disabled:opacity-60"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            치과에 보여줄 요약 이미지 저장
          </button>
          {exportError && (
            <p className="m-0 mt-2 px-1 text-[11px] text-danger">{exportError}</p>
          )}
        </>
      )}

      <TrendChartSection
        data={trend.map((t) => ({ date: formatShortDate(t.date), score: t.score }))}
      />

      <RiskAnalysisSection
        plaque={report?.summary.totalPlaqueRatio ?? 0}
        calculus={report?.summary.totalCalculusRatio ?? 0}
        analysisResults={analysisResults}
      />

      <LLMGuideSection items={guideItems} isLoading={llmLoading} />

      {careGuideItems.length > 0 && <CareGuideSection items={careGuideItems} />}

      {llm?.disclaimer && (
        <p className="m-0 mt-3 px-1 text-[11px] leading-relaxed text-gray-400">{llm.disclaimer}</p>
      )}

      <HistoryListSection
        items={records.map((r) => ({
          date: formatDate(r.date),
          time: formatTime(r.time),
          score: r.score,
          grade: scoreGrade(r.score),
        }))}
      />

      </main>
      <NavBar activeTab="history" />
    </PageShell>
  );
}
