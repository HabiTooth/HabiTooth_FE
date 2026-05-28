'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { Check } from 'lucide-react';
import Button from '@/components/atoms/Button';

type Step = 1 | 2 | 3;
type ScanStepStatus = 'waiting' | 'scanning' | 'done';

interface ScanStep {
  title: string;
  desc: string;
  status: ScanStepStatus;
}

const INITIAL_SCAN_STEPS: ScanStep[] = [
  { title: '구강 이미지 캡처', desc: '촬영 이미지를 처리하고 있어요', status: 'waiting' },
  { title: '치아 경계 분석', desc: '치아 형태를 파악하고 있어요', status: 'waiting' },
  { title: '3D 모델 생성', desc: '구강 구조를 모델링하고 있어요', status: 'waiting' },
  { title: '데이터 저장', desc: '구강 구조를 저장하고 있어요', status: 'waiting' },
];

const PageWrapper = styled.div`
  max-width: 430px;
  min-height: 100svh;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.background};
  padding: 60px 20px 40px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 8px;
`;

const PageTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PageSubtitle = styled.p`
  margin: 0 0 24px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
`;

const StepDot = styled.div<{ $active: boolean; $done: boolean }>`
  width: ${({ $active }) => ($active ? '24px' : '8px')};
  height: 8px;
  border-radius: 4px;
  background: ${({ theme, $active, $done }) =>
    $active || $done ? theme.colors.primary : theme.colors.hairline};
  transition: all 0.3s;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadow.card};
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
`;

const GuideContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const GuideText = styled.p`
  margin: 0;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

const MaskFrame = styled.div`
  width: 100%;
  max-width: 280px;
  aspect-ratio: 4/3;
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const CornerMark = styled.div<{ $pos: string }>`
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: ${({ theme }) => theme.colors.primary};
  border-style: solid;
  border-width: 0;
  ${({ $pos }) => {
    const [v, h] = $pos.split('-');
    return `
      ${v}: -1px;
      ${h}: -1px;
      border-${v}-width: 3px;
      border-${h}-width: 3px;
      border-${v}-${h}-radius: 4px;
    `;
  }}
`;

const MaskGuideText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
`;

const scanPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const ScanStepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
`;

const ScanStepItem = styled.div<{ $last: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 0;
  border-bottom: ${({ $last, theme }) => ($last ? 'none' : `1px solid ${theme.colors.hairline}`)};
`;

const ScanStepBadge = styled.div<{ $status: ScanStepStatus; $index: number }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid
    ${({ theme, $status }) =>
      $status === 'done'
        ? theme.colors.primary
        : $status === 'scanning'
          ? theme.colors.primary
          : theme.colors.hairline};
  background: ${({ theme, $status }) =>
    $status === 'done' ? theme.colors.primary : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme, $status }) =>
    $status === 'done'
      ? 'white'
      : $status === 'scanning'
        ? theme.colors.primary
        : theme.colors.textSecondary};
  animation: ${({ $status }) => ($status === 'scanning' ? scanPulse : 'none')} 1.2s ease-in-out infinite;
`;

const ScanStepInfo = styled.div`
  flex: 1;
`;

const ScanStepTitle = styled.p<{ $active: boolean }>`
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.textPrimary : theme.colors.textSecondary};
`;

const ScanStepDesc = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ScanStepStatusText = styled.span<{ $status: ScanStepStatus }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, $status }) =>
    $status === 'done'
      ? theme.colors.success
      : $status === 'scanning'
        ? theme.colors.primary
        : theme.colors.textSecondary};
  white-space: nowrap;
`;

const ProgressBarWrap = styled.div`
  margin-top: 20px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ProgressTrack = styled.div`
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.hairline};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme }) => theme.colors.primaryGradient};
  border-radius: 3px;
  transition: width 0.4s ease;
`;

const CompleteContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const CheckCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primaryGradient};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CompleteTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
`;

const CompleteDesc = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;


export default function OralSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>(INITIAL_SCAN_STEPS);
  const [currentScanIdx, setCurrentScanIdx] = useState(-1);

  const doneCount = scanSteps.filter((s) => s.status === 'done').length;
  const progress = Math.round((doneCount / scanSteps.length) * 100);

  useEffect(() => {
    if (step !== 2) return;
    setCurrentScanIdx(0);
  }, [step]);

  useEffect(() => {
    if (currentScanIdx < 0 || currentScanIdx >= scanSteps.length) return;

    setScanSteps((prev) =>
      prev.map((s, i) =>
        i === currentScanIdx
          ? { ...s, status: 'scanning' }
          : i < currentScanIdx
            ? { ...s, status: 'done' }
            : s
      )
    );

    const t = setTimeout(() => {
      if (currentScanIdx < scanSteps.length - 1) {
        setCurrentScanIdx((i) => i + 1);
      } else {
        setScanSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
        setTimeout(() => setStep(3), 600);
      }
    }, 1400);

    return () => clearTimeout(t);
  }, [currentScanIdx, scanSteps.length]);

  return (
    <PageWrapper>
      <Header>
        <PageTitle>구강 구조 등록</PageTitle>
        <PageSubtitle>최초 1회만 진행합니다</PageSubtitle>
      </Header>

      <StepIndicator>
        {([1, 2, 3] as Step[]).map((n) => (
          <StepDot key={n} $active={step === n} $done={step > n} />
        ))}
      </StepIndicator>

      <Card>
        {step === 1 && (
          <GuideContainer>
            <GuideText>가이드 마스크에 맞춰 구강을 촬영해 주세요</GuideText>
            <MaskFrame>
              <CornerMark $pos="top-left" />
              <CornerMark $pos="top-right" />
              <CornerMark $pos="bottom-left" />
              <CornerMark $pos="bottom-right" />
              <MaskGuideText>입을 크게 벌려주세요</MaskGuideText>
            </MaskFrame>
            <GuideText style={{ fontSize: '13px' }}>충분한 조명 아래서 촬영하면 더 정확해요</GuideText>
          </GuideContainer>
        )}

        {step === 2 && (
          <>
            <ScanStepList>
              {scanSteps.map((s, i) => (
                <ScanStepItem key={i} $last={i === scanSteps.length - 1}>
                  <ScanStepBadge $status={s.status} $index={i}>
                    {s.status === 'done' ? (
                      <Check size={14} color="white" strokeWidth={2.5} />
                    ) : (
                      i + 1
                    )}
                  </ScanStepBadge>
                  <ScanStepInfo>
                    <ScanStepTitle $active={s.status === 'scanning'}>{s.title}</ScanStepTitle>
                    <ScanStepDesc>{s.desc}</ScanStepDesc>
                  </ScanStepInfo>
                  <ScanStepStatusText $status={s.status}>
                    {s.status === 'done' ? '완료' : s.status === 'scanning' ? '진행 중' : '대기 중'}
                  </ScanStepStatusText>
                </ScanStepItem>
              ))}
            </ScanStepList>
            <ProgressBarWrap>
              <ProgressLabel>
                <span>전체 진행률</span>
                <span style={{ color: '#4B7BF5', fontWeight: 600 }}>{progress}%</span>
              </ProgressLabel>
              <ProgressTrack>
                <ProgressFill $pct={progress} />
              </ProgressTrack>
            </ProgressBarWrap>
          </>
        )}

        {step === 3 && (
          <CompleteContainer>
            <CheckCircle>
              <Check size={36} color="white" strokeWidth={2.5} />
            </CheckCircle>
            <CompleteTitle>구강 구조가 등록되었습니다</CompleteTitle>
            <CompleteDesc>이제 AI가 구강 상태를 정확하게 분석할 수 있어요</CompleteDesc>
          </CompleteContainer>
        )}
      </Card>

      <Button
        variant="primary"
        fullWidth
        onClick={() => {
          if (step === 1) setStep(2);
          else if (step === 3) router.push('/dashboard');
        }}
        disabled={step === 2}
      >
        {step === 1 ? '촬영 시작' : step === 2 ? '분석 중...' : '홈으로 이동'}
      </Button>
    </PageWrapper>
  );
}
