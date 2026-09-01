'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import ToothStatusItem from '@/components/molecules/ToothStatusItem';
import { scoreDiffText, scoreGrade } from '@/lib/score';
import type { ReportSummaryProps, RiskLevel } from './ReportSummary.types';

const RISK_RANK: Record<RiskLevel, number> = { low: 0, normal: 1, high: 2, 'very-high': 3 };

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-success/15 text-success',
  B: 'bg-primary/15 text-primary',
  C: 'bg-warning/20 text-[#B87F00]',
  D: 'bg-warning/20 text-[#B87F00]',
  F: 'bg-danger/15 text-danger',
};

function focusText(plaque?: RiskLevel, calculus?: RiskLevel): string | null {
  if (!plaque || !calculus) return null;
  const worst = Math.max(RISK_RANK[plaque], RISK_RANK[calculus]);
  if (worst <= RISK_RANK.low) return '치태와 치석 모두 잘 관리되고 있어요';
  if (RISK_RANK[plaque] === RISK_RANK[calculus]) return '치태와 치석을 함께 살펴보면 좋아요';
  return RISK_RANK[plaque] > RISK_RANK[calculus]
    ? '치태가 상대적으로 더 신경 쓰여요'
    : '치석이 상대적으로 더 신경 쓰여요';
}

export default function ReportSummary({
  score,
  prevScore,
  status,
  date,
  reportId,
  plaqueScore,
  calculusScore,
  plaqueRisk,
  calculusRisk,
}: ReportSummaryProps) {
  const router = useRouter();
  const diff = prevScore !== undefined ? score - prevScore : null;
  const grade = scoreGrade(score);
  const focus = focusText(plaqueRisk, calculusRisk);

  const open = reportId ? () => router.push(`/report/${reportId}`) : undefined;

  return (
    <div
      role={open ? 'button' : undefined}
      tabIndex={open ? 0 : undefined}
      onClick={open}
      onKeyDown={open ? (e) => (e.key === 'Enter' || e.key === ' ') && open() : undefined}
      className={`bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mt-4 ${
        open ? 'cursor-pointer transition-transform active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-content">
          {date ? `${date} 분석 결과` : '최근 분석 결과'}
        </h3>
        {open && (
          <span className="flex items-center gap-0.5 text-xs text-muted">
            전체 보기
            <ChevronRight size={14} />
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-24 h-24 bg-primary-light rounded-2xl flex-shrink-0">
          <span className="text-3xl font-bold text-primary">{score}</span>
          <span className="text-xs text-muted">종합 점수</span>
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${GRADE_STYLE[grade]}`}>
              {grade}
            </span>
            <span className="text-sm font-semibold text-content">{status}</span>
          </div>
          {diff !== null && <span className="text-xs text-muted">{scoreDiffText(diff)}</span>}
          {focus && <span className="text-xs text-muted">{focus}</span>}
        </div>
      </div>

      {plaqueScore !== undefined && (
        <>
          <div className="border-t border-dashed border-hairline my-4" />
          <h4 className="text-sm font-semibold text-content mb-3">위험도 요약</h4>
          <div className="grid grid-cols-2 gap-3">
            <ToothStatusItem label="치태" score={plaqueScore} riskLevel={plaqueRisk!} />
            <ToothStatusItem label="치석" score={calculusScore!} riskLevel={calculusRisk!} />
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            {[
              { label: '낮음', color: 'bg-[#4A86D9]' },
              { label: '보통', color: 'bg-[#F0B65A]' },
              { label: '높음', color: 'bg-[#EE8A86]' },
              { label: '매우 높음', color: 'bg-[#DC2626]' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-[10px] text-muted">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
