'use client';

import styled from 'styled-components';
import type { ScoreCardProps } from './ScoreCard.types';

const Card = styled.div`
  background: linear-gradient(135deg, #4D7EF7, #6B9BFF);
  border-radius: 24px;
  padding: 28px 24px;
  color: white;
  position: relative;
  overflow: hidden;
`;

const Label = styled.p`
  font-size: 15px;
  opacity: 0.9;
  margin: 0 0 8px 0;
`;

const ScoreWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
`;

const Score = styled.span`
  font-size: 64px;
  font-weight: 800;
  line-height: 1;
`;

const Total = styled.span`
  font-size: 20px;
  opacity: 0.8;
  margin-bottom: 8px;
`;

const Diff = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 13px;
  margin-top: 12px;
`;

const ScanButton = styled.button`
  margin-top: 20px;
  background: white;
  color: #4D7EF7;
  border: none;
  border-radius: 999px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export default function ScoreCard({ score, prevScore }: ScoreCardProps) {
  const diff = prevScore !== undefined ? score - prevScore : null;

  return (
    <Card>
      <Label>오늘의 구강 점수</Label>
      <ScoreWrapper>
        <Score>{score}</Score>
        <Total>/100</Total>
      </ScoreWrapper>
      {diff !== null && (
        <Diff>
          ↑ 지난 스캔보다 {diff}점 향상되었어요!
        </Diff>
      )}
      <ScanButton>
        AI 스캔 시작하기 →
      </ScanButton>
    </Card>
  );
}