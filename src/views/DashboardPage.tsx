'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ScoreCard from '@/components/molecules/ScoreCard';
import NavBar from '@/components/organisms/NavBar';
import ScanBanner from '@/components/molecules/ScanBanner';
import ReportSummary from '@/components/organisms/ReportSummary';
import Header from '@/components/organisms/Header';
import { dashboardApi, type DashboardReport, type DashboardRisk, type DashboardScore } from '@/lib/api/dashboard';
import { formatDateTime, scoreStatus, toSummaryRisk } from '@/lib/score';

export default function DashboardPage() {
  const router = useRouter();
  const [score, setScore] = useState<DashboardScore | null>(null);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [risk, setRisk] = useState<DashboardRisk | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      dashboardApi.getScore(),
      dashboardApi.getReport(),
      dashboardApi.getRisk(),
    ]).then(([s, r, k]) => {
      if (s.status === 'fulfilled') setScore(s.value.data.result);
      if (r.status === 'fulfilled') setReport(r.value.data.result);
      if (k.status === 'fulfilled') setRisk(k.value.data.result);
      setLoaded(true);
    });
  }, []);

  const plaque = risk?.categories.find((c) => c.lesionType === 'PLAQUE');
  const calculus = risk?.categories.find((c) => c.lesionType === 'CALCULUS');

  return (
    <main className="max-w-[430px] mx-auto p-6 bg-[#EEF2FF] min-h-screen pb-20">
      <Header hasNotification />

      {score && (
        <ScoreCard
          score={score.score}
          prevScore={score.scoreDiff === null ? undefined : score.score - score.scoreDiff}
        />
      )}

      {report && (
        <ReportSummary
          score={report.averageScore}
          status={scoreStatus(report.averageScore)}
          date={formatDateTime(report.scannedAt)}
          reportId={String(report.sessionId)}
          plaqueScore={plaque?.affectedRatio}
          calculusScore={calculus?.affectedRatio}
          plaqueRisk={plaque && toSummaryRisk(plaque.riskLevel)}
          calculusRisk={calculus && toSummaryRisk(calculus.riskLevel)}
        />
      )}

      {loaded && !score && (
        <div className="bg-white rounded-2xl p-8 mt-4 text-center">
          <p className="m-0 text-sm text-gray-500">아직 스캔 기록이 없어요.</p>
        </div>
      )}

      <ScanBanner
        title="AI 구강 분석을 시작해보세요"
        description={'실시간 스캔 후 AI가\n구강 상태를 분석해드려요'}
        onClick={() => router.push('/scan')}
      />
      <NavBar activeTab="home" />
    </main>
  );
}
