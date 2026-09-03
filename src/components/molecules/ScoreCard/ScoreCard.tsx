'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/Button';
import { scoreDiffText } from '@/lib/score';
import type { ScoreCardProps } from './ScoreCard.types';

export default function ScoreCard({ score, prevScore }: ScoreCardProps) {
  const router = useRouter();
  const diff = score !== null && prevScore !== undefined ? score - prevScore : null;

  return (
    <div className="bg-gradient-to-br from-[#4A86D9] to-[#7EB8F7] rounded-3xl p-7 text-white relative overflow-hidden shadow-card">
      <img
        src="/images/tooth-3.png"
        alt=""
        aria-hidden
        className="absolute -right-2 -bottom-4 w-44 h-44 object-contain pointer-events-none"
        style={{
          filter:
            'drop-shadow(0 8px 28px rgba(255,255,255,0.3)) drop-shadow(0 0 20px rgba(103,232,249,0.45))',
        }}
      />

      <div className="flex flex-col">
        {score === null ? (
          <>
            <p className="m-0 text-sm opacity-90 mb-2">오늘의 구강 점수</p>
            <div className="flex items-end gap-1">
              <span className="text-6xl font-bold leading-none opacity-50">--</span>
              <span className="text-xl opacity-60 mb-1.5">/100</span>
            </div>
            <p className="m-0 mt-3 text-xs opacity-90 max-w-[210px] leading-relaxed">
              아직 스캔 기록이 없어요.
              <br />첫 스캔을 마치면 점수가 나와요.
            </p>
          </>
        ) : (
          <>
            <p className="m-0 text-sm opacity-90 mb-2">오늘의 구강 점수</p>
            <div className="flex items-end gap-1">
              <span className="text-7xl font-bold leading-none">{score}</span>
              <span className="text-xl opacity-80 mb-2">/100</span>
            </div>
            {diff !== null && (
              <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs mt-3 w-fit">
                {diff > 0 ? '↑' : diff < 0 ? '↓' : '·'} {scoreDiffText(diff)}
              </div>
            )}
            <p className="m-0 mt-3 text-xs opacity-90 max-w-[210px] leading-relaxed">
              실시간 스캔 후 AI가
              <br />구강 상태를 분석해 드려요.
            </p>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="mt-5 !border-white/40 !text-white !bg-white/20 !w-fit"
          onClick={() => router.push('/scan')}
        >
          AI 스캔 시작하기 →
        </Button>
      </div>
    </div>
  );
}
