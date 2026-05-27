'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import Checkbox from '@/components/atoms/Checkbox';
import Button from '@/components/atoms/Button';

const PageWrapper = styled.div`
  max-width: 430px;
  min-height: 100svh;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.background};
  padding: 60px 20px 40px;
  display: flex;
  flex-direction: column;
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 36px;
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

const AppTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  letter-spacing: -0.3px;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadow.card};
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.hairline};
  margin: 12px 0;
`;

const TermRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
`;

const RequiredTag = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PermissionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.hairline};
  }
`;

const PermissionIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const PermissionText = styled.div``;

const PermissionTitle = styled.p`
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PermissionDesc = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Spacer = styled.div`
  flex: 1;
  min-height: 24px;
`;

const ToothIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      d="M16 3C12 3 9 6 9 10c0 2.7 1.4 5 3.5 6.3.9.6 1.5 1.7 1.5 3v5c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-5c0-1.3.6-2.4 1.5-3C21.6 15 23 12.7 23 10c0-4-3-7-7-7z"
      fill="white"
    />
  </svg>
);

export default function OnboardingPage() {
  const router = useRouter();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const allChecked = terms && privacy && marketing;
  const requiredChecked = terms && privacy;

  const toggleAll = (v: boolean) => {
    setTerms(v);
    setPrivacy(v);
    setMarketing(v);
  };

  const handleIndividual = (setter: (v: boolean) => void) => (v: boolean) => {
    setter(v);
  };

  return (
    <PageWrapper>
      <LogoSection>
        <IconBox>
          <ToothIcon />
        </IconBox>
        <AppTitle>HabiTooth</AppTitle>
        <Subtitle>AI 구강 케어 어시스턴트</Subtitle>
      </LogoSection>

      <Card>
        <CardTitle>약관 동의</CardTitle>
        <Checkbox label="전체 동의" checked={allChecked} onChange={toggleAll} bold />
        <Divider />
        <TermRow>
          <Checkbox
            label="이용약관 동의"
            checked={terms}
            onChange={handleIndividual(setTerms)}
          />
          <RequiredTag>필수</RequiredTag>
        </TermRow>
        <TermRow>
          <Checkbox
            label="개인정보 처리방침 동의"
            checked={privacy}
            onChange={handleIndividual(setPrivacy)}
          />
          <RequiredTag>필수</RequiredTag>
        </TermRow>
        <TermRow>
          <Checkbox
            label="마케팅 수신 동의"
            checked={marketing}
            onChange={handleIndividual(setMarketing)}
          />
          <RequiredTag>선택</RequiredTag>
        </TermRow>
      </Card>

      <Card>
        <CardTitle>권한 안내</CardTitle>
        <PermissionRow>
          <PermissionIcon>📷</PermissionIcon>
          <PermissionText>
            <PermissionTitle>카메라</PermissionTitle>
            <PermissionDesc>구강 촬영에 필요합니다</PermissionDesc>
          </PermissionText>
        </PermissionRow>
        <PermissionRow>
          <PermissionIcon>📡</PermissionIcon>
          <PermissionText>
            <PermissionTitle>블루투스</PermissionTitle>
            <PermissionDesc>디바이스 연결에 필요합니다</PermissionDesc>
          </PermissionText>
        </PermissionRow>
      </Card>

      <Spacer />
      <Button variant="primary" fullWidth disabled={!requiredChecked} onClick={() => router.push('/login')}>
        시작하기
      </Button>
    </PageWrapper>
  );
}
