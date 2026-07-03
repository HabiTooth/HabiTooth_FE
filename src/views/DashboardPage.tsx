'use client';

import ScoreCard from '@/components/molecules/ScoreCard';
import NavBar from '@/components/organisms/NavBar';
import ScanBanner from '@/components/molecules/ScanBanner';
import ReportSummary from '@/components/organisms/ReportSummary';
import Header from '@/components/organisms/Header';

export default function DashboardPage() {
  return (
    <main className="max-w-[430px] mx-auto p-6 bg-[#EEF2FF] min-h-screen pb-20">
      <Header hasNotification={true} />
      <ScoreCard score={82} prevScore={76} />
      <ReportSummary
  score={82}
  prevScore={76}
  grade="B"
  status="양호"
  date="2025.05.15 14:30"
  reportId="abc123"
  plaqueScore={52}
  calculusScore={68}
  plaqueRisk="normal"
  calculusRisk="high"
/>
      <ScanBanner
        title="AI 구강 분석을 시작해보세요"
        description={"실시간 스캔 후 AI가\n구강 상태를 분석해드려요"}
        onClick={() => {}}
      />
      <NavBar activeTab="home" />
    </main>
  );
}