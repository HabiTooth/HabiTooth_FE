'use client';

import Link from 'next/link';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import MoreLink from '@/components/atoms/MoreLink';
import { compareSummary, type CompareResult } from '@/lib/compare';
import { toothName } from '@/lib/dentition';
import { RISK_TAG } from '@/lib/lesionRisk';
import { RISK_MODEL_FILL } from '@/lib/riskColors';

export default function ChangeSummary({
  result,
  scoreDelta,
  previousDate,
  onToothClick,
}: {
  result: CompareResult;
  scoreDelta: number | null;
  previousDate: string;
  // 있으면 치아 행이 버튼이 되고 카드 링크 대신 이게 불린다
  onToothClick?: (tooth: number) => void;
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

      <p className="m-0 text-[13px] text-content leading-relaxed">
        {compareSummary(result, scoreDelta)}
      </p>

      {notable.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-hairline flex flex-col gap-1">
          {notable.map((change) => {
            const better = change.delta < 0;
            return (
              <div
                key={change.toothNumber}
                role={onToothClick ? 'button' : undefined}
                tabIndex={onToothClick ? 0 : undefined}
                onClick={
                  onToothClick
                    ? (e) => {
                        e.preventDefault();
                        onToothClick(change.toothNumber);
                      }
                    : undefined
                }
                onKeyDown={
                  onToothClick
                    ? (e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        onToothClick(change.toothNumber);
                      }
                    : undefined
                }
                className={`flex items-center gap-2 py-1.5 ${onToothClick ? 'cursor-pointer rounded-md -mx-1 px-1 hover:bg-primary-light/60' : ''}`}
              >
                <span
                  className={`inline-block rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${
                    better ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                  }`}
                >
                  {better ? '좋아짐' : '나빠짐'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-content leading-tight">
                    {toothName(change.toothNumber)}
                  </span>
                  <span className="block text-[10.5px] text-muted">{change.toothNumber}번</span>
                </span>
                <span className="flex items-center gap-1 text-[11.5px] text-muted">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: RISK_MODEL_FILL[change.before] }}
                  />
                  {RISK_TAG[change.before]}
                  <ArrowRight size={11} className="flex-shrink-0" />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: RISK_MODEL_FILL[change.after] }}
                  />
                  <span className="font-semibold text-content">{RISK_TAG[change.after]}</span>
                </span>
              </div>
            );
          })}
          {result.improved.length + result.worsened.length > notable.length && (
            <p className="m-0 mt-1 text-[11px] text-muted">
              그 외 {result.improved.length + result.worsened.length - notable.length}개 더
              바뀌었어요. 누르면 위 모형에서 봐요
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
