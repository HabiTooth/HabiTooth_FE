import ScoreCard from '@/components/molecules/ScoreCard';
import NavBar from '@/components/organisms/NavBar';
import ScoreRing from '@/components/atoms/ScoreRing';

export default function DashboardPage() {
  return (
    <main className="p-6 bg-[#E8ECF4] min-h-screen pb-20">
      <ScoreCard score={82} prevScore={76} />
      <div className="flex gap-4 mt-4">
        <ScoreRing score={52} color="#F0B65A" size={100} strokeWidth={10} />
        <ScoreRing score={68} color="#EE8A86" size={100} strokeWidth={10} />
        <ScoreRing score={85} color="#4A86D9" size={100} strokeWidth={10} />
      </div>
      <NavBar activeTab="home" />
    </main>
  );
}