'use client';

import ScoreCard from '@/components/molecules/ScoreCard';
import NavBar from '@/components/organisms/NavBar';
import AnalysisResult from '@/components/molecules/AnalysisResult';
import ScanBanner from '@/components/molecules/ScanBanner';
import QuickMenu from '@/components/organisms/QuickMenu';
import RiskSummary from '@/components/organisms/RiskSummary';

export default function DashboardPage() {
  return (
    <main className="p-6 bg-[#E8ECF4] min-h-screen pb-20">
      <ScoreCard score={82} prevScore={76} />
      <AnalysisResult
        date="2025.05.15"
        time="14:30"
        score={82}
        plaqueRisk="normal"
        calculusRisk="high"
      />
      <RiskSummary
        plaqueScore={52}
        calculusScore={68}
        gumScore={85}
        plaqueRisk="normal"
        calculusRisk="high"
        gumRisk="low"
      />
      <ScanBanner
        title="AI 구강 분석을 시작해보세요"
        description={"실시간 스캔 후 AI가\n구강 상태를 분석해드려요"}
        onClick={() => {}}
      />
      <QuickMenu />
      <NavBar activeTab="home" />
    </main>
  );
}