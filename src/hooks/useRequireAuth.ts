'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { isTokenExpired } from '@/lib/tokenStorage';

export function useRequireAuth(): boolean {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const { token, clearAuth } = useAuthStore.getState();
    if (!token || isTokenExpired(token)) {
      clearAuth();
      router.replace('/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  return authorized;
}
