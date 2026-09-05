'use client';

import { useEffect, useState } from 'react';
import ScoreCard from '@/components/molecules/ScoreCard';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import QuickMenu from '@/components/organisms/QuickMenu';
import ReportSummary from '@/components/organisms/ReportSummary';
import Header from '@/components/organisms/Header';
import {
  dashboardApi,
  type DashboardReport,
  type DashboardRisk,
  type DashboardScore,
} from '@/lib/api/dashboard';
import { formatDateTime, scoreStatus, toSummaryRisk } from '@/lib/score';

export default function DashboardPage() {
  const [score, setScore] = useState<DashboardScore | null>(null);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [risk, setRisk] = useState<DashboardRisk | null>(null);

  useEffect(() => {
    Promise.allSettled([
      dashboardApi.getScore(),
      dashboardApi.getReport(),
      dashboardApi.getRisk(),
    ]).then(([s, r, k]) => {
      if (s.status === 'fulfilled') setScore(s.value.data.result);
      if (r.status === 'fulfilled') setReport(r.value.data.result);
      if (k.status === 'fulfilled') setRisk(k.value.data.result);
    });
  }, []);

  const plaque = risk?.categories.find((c) => c.lesionType === 'PLAQUE');
  const calculus = risk?.categories.find((c) => c.lesionType === 'CALCULUS');

  const hasScore = score !== null && score.score !== null;
  const hasReport = report !== null && report.sessionId !== null;

  return (
    <PageShell withNav>
      <main className="px-5 pt-5">
        <Header />

        <ScoreCard
          score={hasScore ? score!.score! : null}
          prevScore={
            hasScore && score!.scoreDiff !== null ? score!.score! - score!.scoreDiff! : undefined
          }
        />

        <QuickMenu />

        {hasReport && (
          <ReportSummary
            score={report!.averageScore}
            status={scoreStatus(report!.averageScore)}
            date={formatDateTime(report!.scannedAt)}
            reportId={String(report!.sessionId)}
            plaqueScore={plaque?.affectedRatio}
            calculusScore={calculus?.affectedRatio}
            plaqueRisk={plaque && toSummaryRisk(plaque.riskLevel)}
            calculusRisk={calculus && toSummaryRisk(calculus.riskLevel)}
          />
        )}
      </main>
      <NavBar activeTab="home" />
    </PageShell>
  );
}
