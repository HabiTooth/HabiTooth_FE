'use client';

import type { ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

// 로그인이 필요한 페이지를 감싼다. 검사 중에는 빈 화면을 그려
// 만료된 세션으로 내용이 잠깐 보이는 것을 막는다.
export default function AuthGuard({ children }: { children: ReactNode }) {
  const authorized = useRequireAuth();
  if (!authorized) return <div className="min-h-svh bg-background" />;
  return <>{children}</>;
}
