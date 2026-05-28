import ScoreCard from '@/components/molecules/ScoreCard';
import NavBar from '@/components/organisms/NavBar';

export default function DashboardPage() {
  return (
    <main className="p-6 bg-[#E8ECF4] min-h-screen pb-20">
      <ScoreCard score={82} prevScore={76} />
      <NavBar activeTab="home" />
    </main>
  );
}