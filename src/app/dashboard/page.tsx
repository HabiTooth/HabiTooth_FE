import ScoreCard from '@/components/molecules/ScoreCard';

export default function DashboardPage() {
  return (
    <main className="p-6 bg-[#E8ECF4] min-h-screen">
      <ScoreCard score={82} prevScore={76} />
    </main>
  );
}