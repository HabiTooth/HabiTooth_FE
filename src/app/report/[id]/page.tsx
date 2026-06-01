'use client';

import Header from '@/components/organisms/Header';
import NavBar from '@/components/organisms/NavBar';
import ReportSummary from '@/components/organisms/ReportSummary';
import LLMGuideSection from '@/components/organisms/LLMGuideSection';
import RiskAnalysisSection from '@/components/organisms/RiskAnalysisSection';
import CareGuideSection from '@/components/organisms/CareGuideSection';

export default function ReportPage() {
  return (
    <main className="p-6 bg-[#E8ECF4] min-h-screen pb-20">
      <Header />
      <ReportSummary
        score={72}
        prevScore={69}
        grade="B"
        status="주의 필요"
      />
      <RiskAnalysisSection
        plaque={12}
        calculus={5}
      />
      <LLMGuideSection
        items={[
          {
            type: 'warning',
            title: '하악 앞니 안쪽에 치태가 있습니다.',
            description: '하악 전치부(앞니) 설면에 치태가 중등도로 축적되어 있어요. 칫솔을 45도 각도로 눕혀 부드럽게 닦아주세요.',
          },
          {
            type: 'danger',
            title: '상악 오른쪽 어금니 부위에 치석이 보입니다.',
            description: '상악 우측 대구치(어금니) 치은면 근처에 치석이 있어요. 정기적인 스케일링을 권장드려요.',
          },
          {
            type: 'good',
            title: '전반적으로 양호한 상태입니다!',
            description: '대부분의 치아 표면이 깨끗하게 관리되고 있어요. 지금처럼 꾸준히 관리하면 더 건강한 구강을 유지할 수 있어요.',
          },
        ]}
      />
      <CareGuideSection
        items={[
          {
            icon: '🪥',
            title: '칫솔질 가이드',
            description: '앞니 안쪽은 45도 각도로 작은 원을 그리며 닦아주세요.',
            buttonLabel: '자세히 보기',
          },
          {
            icon: '🧵',
            title: '치실 사용',
            description: '치아 사이에 낀 음식물과 치태를 제거해 주세요.',
            buttonLabel: '자세히 보기',
          },
          {
            icon: '🗓️',
            title: '스케일링 추천',
            description: '치석 제거를 위해 6개월 내 내원 추천드려요.',
            buttonLabel: '예약하기',
          },
        ]}
      />
      <NavBar activeTab="history" />
    </main>
  );
}