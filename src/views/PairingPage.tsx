'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import Button from '@/components/atoms/Button';

type ConnectionStatus = 'connecting' | 'connected';

const PageWrapper = styled.div`
  max-width: 430px;
  min-height: 100svh;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.background};
  padding: 60px 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PageTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
`;

const PageSubtitle = styled.p`
  margin: 0 0 48px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.7; }
`;

const ripple = keyframes`
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(1.6); opacity: 0; }
`;

const DeviceWrapper = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
`;

const RippleCircle = styled.div<{ $delay: string }>`
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryLight};
  animation: ${ripple} 2s ease-out ${({ $delay }) => $delay} infinite;
`;

const DeviceIcon = styled.div<{ $connected: boolean }>`
  width: 100px;
  height: 100px;
  background: ${({ theme, $connected }) =>
    $connected ? theme.colors.primaryGradient : theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.radius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  animation: ${({ $connected }) => (!$connected ? pulse : 'none')} 2s ease-in-out infinite;
  transition: background 0.5s;
`;

const StatusCard = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadow.card};
  margin-bottom: 40px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatusDot = styled.span<{ $connected: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ theme, $connected }) =>
    $connected ? theme.colors.success : theme.colors.warning};
  flex-shrink: 0;
`;

const StatusText = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const HintText = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding-left: 22px;
`;

const Spacer = styled.div`
  flex: 1;
`;

const DeviceSvg = ({ connected }: { connected: boolean }) => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <rect x="20" y="4" width="12" height="28" rx="6" fill={connected ? 'white' : '#4B7BF5'} />
    <rect x="16" y="30" width="20" height="16" rx="4" fill={connected ? 'white' : '#4B7BF5'} />
    <circle cx="26" cy="38" r="3" fill={connected ? '#4B7BF5' : 'white'} />
  </svg>
);

export default function PairingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const t = setTimeout(() => setStatus('connected'), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <PageWrapper>
      <PageTitle>디바이스 연결</PageTitle>
      <PageSubtitle>디바이스의 전원을 켜고 앱 근처에 두세요</PageSubtitle>

      <DeviceWrapper>
        {status === 'connecting' && (
          <>
            <RippleCircle $delay="0s" />
            <RippleCircle $delay="0.7s" />
            <RippleCircle $delay="1.4s" />
          </>
        )}
        <DeviceIcon $connected={status === 'connected'}>
          <DeviceSvg connected={status === 'connected'} />
        </DeviceIcon>
      </DeviceWrapper>

      <StatusCard>
        <StatusRow>
          <StatusDot $connected={status === 'connected'} />
          <StatusText>
            {status === 'connecting' ? '연결 중...' : '연결 완료'}
          </StatusText>
        </StatusRow>
        <HintText>
          {status === 'connecting'
            ? 'HabiTooth 디바이스를 찾고 있습니다'
            : 'HabiTooth 디바이스가 연결되었습니다'}
        </HintText>
      </StatusCard>

      <Spacer />
      <Button
        variant="primary"
        fullWidth
        disabled={status !== 'connected'}
        onClick={() => router.push('/oral-setup')}
      >
        다음
      </Button>
    </PageWrapper>
  );
}
