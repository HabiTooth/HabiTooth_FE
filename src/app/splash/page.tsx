'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

const PageWrapper = styled.div`
  max-width: 430px;
  height: 100svh;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.primaryGradient};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const IconBox = styled.div`
  width: 88px;
  height: 88px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: ${({ theme }) => theme.radius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TextBlock = styled.div`
  text-align: center;
`;

const AppTitle = styled.h1`
  margin: 0 0 6px;
  font-size: 34px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.5px;
`;

const Tagline = styled.p`
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
`;

const ToothIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <path
      d="M24 5C18 5 13 9.5 13 15.5c0 4 2.2 7.5 5.4 9.5 1.4.9 2.3 2.5 2.3 4.5v8c0 1.1.9 2 2 2h2.6c1.1 0 2-.9 2-2v-8c0-2 .9-3.6 2.3-4.5 3.2-2 5.4-5.5 5.4-9.5 0-6-5-10.5-11-10.5z"
      fill="white"
    />
  </svg>
);

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/onboarding'), 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <PageWrapper>
      <IconBox>
        <ToothIcon />
      </IconBox>
      <TextBlock>
        <AppTitle>HabiTooth</AppTitle>
        <Tagline>AI 구강 케어 어시스턴트</Tagline>
      </TextBlock>
    </PageWrapper>
  );
}
