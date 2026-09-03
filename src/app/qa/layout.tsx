import { notFound } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

// 기록 전체 삭제 버튼이 있어서 배포본에서는 막음
const ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_QA === 'true';

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!ENABLED) notFound();
  return <AuthGuard>{children}</AuthGuard>;
}
