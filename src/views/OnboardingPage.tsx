'use client';

import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Camera, Bluetooth, Bot, BarChart3 } from 'lucide-react';
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

const FeatureRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.hairline};
  }
`;

const FeatureIconBox = styled.div`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
`;

const FeatureInfo = styled.div``;

const FeatureTitle = styled.p`
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const FeatureDesc = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
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
  color: ${({ theme }) => theme.colors.primary};
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

  return (
    <PageWrapper>
      <LogoSection>
        <IconBox>
          <ToothIcon />
        </IconBox>
        <AppTitle>HabiTooth</AppTitle>
        <Subtitle>가정용 AI 구강 모니터링 디바이스</Subtitle>
      </LogoSection>

      <Card>
        <CardTitle>주요 기능</CardTitle>
        <FeatureRow>
          <FeatureIconBox><Camera size={20} /></FeatureIconBox>
          <FeatureInfo>
            <FeatureTitle>UV 듀얼 촬영</FeatureTitle>
            <FeatureDesc>치태·치석을 눈에 보이지 않던 영역까지 감지해요</FeatureDesc>
          </FeatureInfo>
        </FeatureRow>
        <FeatureRow>
          <FeatureIconBox><Bot size={20} /></FeatureIconBox>
          <FeatureInfo>
            <FeatureTitle>AI 구강 모니터링</FeatureTitle>
            <FeatureDesc>AI가 관리 위험 부위를 정밀하게 분석해요</FeatureDesc>
          </FeatureInfo>
        </FeatureRow>
        <FeatureRow>
          <FeatureIconBox><BarChart3 size={20} /></FeatureIconBox>
          <FeatureInfo>
            <FeatureTitle>3D 리포트</FeatureTitle>
            <FeatureDesc>구강 상태를 3D로 시각화하고 관리 가이드를 제공해요</FeatureDesc>
          </FeatureInfo>
        </FeatureRow>
      </Card>

      <Card>
        <CardTitle>권한 안내</CardTitle>
        <PermissionRow>
          <PermissionIcon><Camera size={20} /></PermissionIcon>
          <PermissionText>
            <PermissionTitle>카메라</PermissionTitle>
            <PermissionDesc>구강 촬영에 필요해요</PermissionDesc>
          </PermissionText>
        </PermissionRow>
        <PermissionRow>
          <PermissionIcon><Bluetooth size={20} /></PermissionIcon>
          <PermissionText>
            <PermissionTitle>블루투스</PermissionTitle>
            <PermissionDesc>디바이스 연결에 필요해요</PermissionDesc>
          </PermissionText>
        </PermissionRow>
      </Card>

      <Spacer />
      <Button variant="primary" fullWidth onClick={() => router.push('/login')}>
        시작하기
      </Button>
    </PageWrapper>
  );
}
