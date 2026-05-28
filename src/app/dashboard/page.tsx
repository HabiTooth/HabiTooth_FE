import Button from '@/components/atoms/Button';

export default function DashboardPage() {
  return (
    <main className="p-6 bg-[#f0f4ff] min-h-screen">
      <Button variant="primary">AI 스캔 시작하기 →</Button>
      <Button variant="ghost">ghost 버튼</Button>
      <Button variant="danger">danger 버튼</Button>
    </main>
  );
}