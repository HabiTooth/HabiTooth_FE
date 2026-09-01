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
import { riskAlert, scanReminder } from '@/lib/notifications/rules';
import { useNotificationStore } from '@/stores/notificationStore';

export default function DashboardPage() {
  const [score, setScore] = useState<DashboardScore | null>(null);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [risk, setRisk] = useState<DashboardRisk | null>(null);
  const push = useNotificationStore((s) => s.push);

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

  useEffect(() => {
    for (const n of [scanReminder(score?.scannedAt), riskAlert(risk?.categories, risk?.sessionId)]) {
      if (n) push(n);
    }
  }, [score, risk, push]);

  const plaque = risk?.categories.find((c) => c.lesionType === 'PLAQUE');
  const calculus = risk?.categories.find((c) => c.lesionType === 'CALCULUS');

  const hasScore = score !== null && score.score !== null;
  const hasReport = report !== null && report.sessionId !== null;

  return (
    <PageShell>
      <main className="p-6 pb-20">
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
