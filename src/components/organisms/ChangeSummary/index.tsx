'use client';

import Link from 'next/link';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import MoreLink from '@/components/atoms/MoreLink';
import { compareSummary, type CompareResult } from '@/lib/compare';
import { RISK_LABEL } from '@/lib/score';

export default function ChangeSummary({
  result,
  scoreDelta,
  previousDate,
}: {
  result: CompareResult;
  scoreDelta: number | null;
  previousDate: string;
}) {
  const notable = [...result.worsened, ...result.improved].slice(0, 4);

  return (
    <Link
      href="/compare"
      className="block bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mt-4 no-underline"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="m-0 text-sm font-semibold text-content">직전 스캔 대비</h2>
        <MoreLink />
      </div>

      <div className="flex items-center gap-2 mb-2">
        {scoreDelta !== null && scoreDelta !== 0 && (
          <span
            className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-bold ${
              scoreDelta > 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
            }`}
          >
            {scoreDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {scoreDelta > 0 ? '+' : ''}
            {scoreDelta}점
          </span>
        )}
        {previousDate && <span className="text-[11px] text-muted">{previousDate} 기준</span>}
      </div>

      <p className="m-0 text-[12.5px] text-content leading-relaxed">
        {compareSummary(result, scoreDelta)}
      </p>

      {notable.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-hairline flex flex-col gap-1.5">
          {notable.map((change) => {
            const better = change.delta < 0;
            return (
              <div key={change.toothNumber} className="flex items-center gap-2">
                <span className="w-11 text-[12px] font-semibold text-content tabular-nums">
                  {change.toothNumber}번
                </span>
                <span className="text-[11px] text-muted">{RISK_LABEL[change.before]}</span>
                <ArrowRight size={11} className="text-muted flex-shrink-0" />
                <span
                  className={`text-[11px] font-semibold ${better ? 'text-success' : 'text-danger'}`}
                >
                  {RISK_LABEL[change.after]}
                </span>
              </div>
            );
          })}
          {result.improved.length + result.worsened.length > notable.length && (
            <p className="m-0 mt-0.5 text-[10px] text-muted">
              그 외 {result.improved.length + result.worsened.length - notable.length}개 더 바뀌었어요.
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
