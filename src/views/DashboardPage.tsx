'use client';

import styled from 'styled-components';

const PageWrapper = styled.div`
  max-width: 430px;
  min-height: 100svh;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const IconBox = styled.div`
  width: 64px;
  height: 64px;
  background: ${({ theme }) => theme.colors.primaryGradient};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ToothIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      d="M16 3C12 3 9 6 9 10c0 2.7 1.4 5 3.5 6.3.9.6 1.5 1.7 1.5 3v5c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-5c0-1.3.6-2.4 1.5-3C21.6 15 23 12.7 23 10c0-4-3-7-7-7z"
      fill="white"
    />
  </svg>
);

export default function DashboardPage() {
  return (
    <PageWrapper>
      <IconBox>
        <ToothIcon />
      </IconBox>
      <Title>HabiTooth</Title>
      <Subtitle>대시보드 — 구현 예정</Subtitle>
    </PageWrapper>
  );
}
