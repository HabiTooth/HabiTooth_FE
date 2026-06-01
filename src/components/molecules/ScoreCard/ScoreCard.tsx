'use client';

import Button from '@/components/atoms/Button';
import type { ScoreCardProps } from './ScoreCard.types';

export default function ScoreCard({ score, prevScore }: ScoreCardProps) {
  const diff = prevScore !== undefined ? score - prevScore : null;

  return (
    <div className="bg-gradient-to-br from-[#4A86D9] to-[#7EB8F7] rounded-3xl p-7 text-white relative overflow-hidden">
      <p className="text-sm opacity-90 mb-2">오늘의 구강 점수</p>
      <div className="flex items-end gap-1">
        <span className="text-7xl font-bold leading-none">{score}</span>
        <span className="text-xl opacity-80 mb-2">/100</span>
      </div>
      {diff !== null && (
        <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs mt-3">
          ↑ 지난 스캔보다 {diff}점 향상되었어요!
        </div>
      )}
      <Button variant="ghost" className="mt-5 w-fit">
        AI 스캔 시작하기 →
      </Button>
    </div>
  );
}