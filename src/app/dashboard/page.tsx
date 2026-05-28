import ScoreCard from '@/components/molecules/ScoreCard';

export default function DashboardPage() {
  return (
    <main style={{ padding: '24px', background: '#f0f4ff', minHeight: '100vh' }}>
      <ScoreCard score={82} prevScore={76} />
    </main>
  );
}