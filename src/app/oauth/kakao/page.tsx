'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { destinationAfterLogin } from '@/lib/authRouting';

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) { router.replace('/login'); return; }

    const redirectUri = `${window.location.origin}/oauth/kakao`;

    authApi
      .socialLogin({ provider: 'kakao', authCode: code, redirectUri })
      .then(async (res) => {
        setToken(res.data.result.accessToken);
        router.replace(await destinationAfterLogin());
      })
      .catch(() => router.replace('/login'));
  }, [searchParams, router, setToken]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="text-primary animate-spin" />
      <p className="text-[14px] text-muted">카카오 로그인 중...</p>
    </div>
  );
}
