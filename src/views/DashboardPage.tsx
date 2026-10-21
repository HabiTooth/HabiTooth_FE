'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import ScoreCard from '@/components/molecules/ScoreCard';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import QuickMenu from '@/components/organisms/QuickMenu';
import ReportSummary from '@/components/organisms/ReportSummary';
import Header from '@/components/organisms/Header';
import HabitSummarySection from '@/components/organisms/HabitSummarySection';
import { historyApi, type HistoryToday } from '@/lib/api/history';
import { toKey } from '@/lib/streak';
import {
  dashboardApi,
  type DashboardReport,
  type DashboardRisk,
} from '@/lib/api/dashboard';
import { formatDateTime, scoreStatus, toSummaryRisk } from '@/lib/score';

export default function DashboardPage() {
  const [score, setScore] = useState<HistoryToday | null>(null);
  const [scoreState, setScoreState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [risk, setRisk] = useState<DashboardRisk | null>(null);

  useEffect(() => {
    Promise.allSettled([
      historyApi.getToday(),
      dashboardApi.getReport(),
      dashboardApi.getRisk(),
    ]).then(([s, r, k]) => {
      // 신규 사용자는 result가 비어서 옴
      if (s.status === 'fulfilled') setScore(s.value.data.result ?? null);
      setScoreState(s.status === 'fulfilled' ? 'ready' : 'error');
      if (r.status === 'fulfilled') setReport(r.value.data.result ?? null);
      if (k.status === 'fulfilled') setRisk(k.value.data.result ?? null);
    });
  }, []);

  const plaque = risk?.categories?.find((c) => c.lesionType === 'PLAQUE');
  const calculus = risk?.categories?.find((c) => c.lesionType === 'CALCULUS');
  // 응답 없으면 섹션 숨김, 항목 없으면 미측정
  const lesionScore = (c: typeof plaque) =>
    risk === null
      ? undefined
      : c
        ? {
            riskLevel: c.riskLevel,
            score: typeof c.score === 'number' ? c.score : null,
            affectedTeeth: c.affectedTeeth,
            detectedTeeth: c.detectedTeeth,
          }
        : null;

  const hasScore =
    typeof score?.date === 'string' &&
    typeof score.score === 'number' &&
    score.date.slice(0, 10) === toKey(new Date());
  const hasReport =
    report !== null && report.sessionId != null && typeof report.averageScore === 'number';

  return (
    <PageShell withNav>
      <main className="px-5 pt-5">
        <div className="relative isolate -mx-5 -mt-5 px-5 pt-5 pb-3 rounded-b-[32px] overflow-hidden bg-[#4A86D9]">
        <Image src="/images/dashboard/clay-landscape.webp" alt="" fill sizes="(max-width: 600px) 100vw, 600px" className="object-cover sm:object-[50%_85%]" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3B72BC]/35 via-transparent to-transparent" />
        <div className="relative z-10">
        <Header inverse />

        <ScoreCard
          state={scoreState}
          score={hasScore ? score!.score! : null}
          prevScore={
            hasScore && score!.scoreDiff != null ? score!.score! - score!.scoreDiff : undefined
          }
        />
        </div>
        </div>

        <QuickMenu />

        {hasReport && (
          <ReportSummary
            score={report!.averageScore}
            status={scoreStatus(report!.averageScore)}
            date={formatDateTime(report!.scannedAt)}
            reportId={String(report!.sessionId)}
            plaque={lesionScore(plaque)}
            calculus={lesionScore(calculus)}
            plaqueRisk={plaque && toSummaryRisk(plaque.riskLevel)}
            calculusRisk={calculus && toSummaryRisk(calculus.riskLevel)}
          />
        )}
        <HabitSummarySection />
      </main>
      <NavBar activeTab="home" />
    </PageShell>
  );
}
