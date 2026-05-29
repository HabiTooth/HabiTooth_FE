import ScoreCard from '@/components/molecules/ScoreCard';
import NavBar from '@/components/organisms/NavBar';
import ToothStatusItem from '@/components/molecules/ToothStatusItem';

export default function DashboardPage() {
  return (
    <main className="p-6 bg-[#E8ECF4] min-h-screen pb-20">
      <ScoreCard score={82} prevScore={76} />
      <div className="grid grid-cols-3 gap-3 mt-4">
        <ToothStatusItem label="치태" score={52} riskLevel="normal" />
        <ToothStatusItem label="치석" score={68} riskLevel="high" />
        <ToothStatusItem label="잇몸 건강" score={85} riskLevel="low" />
        </div>
      <NavBar activeTab="home" />
    </main>
  );
}
