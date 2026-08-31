'use client';

import { useRouter } from 'next/navigation';
import ToothStatusItem from '@/components/molecules/ToothStatusItem';
import { scoreDiffText } from '@/lib/score';
import type { ReportSummaryProps } from './ReportSummary.types';

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

  return (
    <div className="bg-white rounded-2xl p-5 mt-4">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          {date ? `${date} 분석 결과` : '최근 분석 결과'}
        </h3>
        {reportId && (
          <button
            onClick={() => router.push(`/report/${reportId}`)}
            className="text-xs text-gray-400"
          >
            전체 보기 &gt;
          </button>
        )}
      </div>

      {/* 점수 */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-24 h-24 bg-[#E8ECF4] rounded-2xl">
          <span className="text-3xl font-bold text-[#4A86D9]">{score}</span>
          <span className="text-xs text-gray-400">종합 점수</span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <span className="text-sm font-semibold text-gray-800">{status}</span>
          {diff !== null && (
            <span className="text-xs text-gray-400">{scoreDiffText(diff)}</span>
          )}
        </div>
      </div>

      {/* 위험도 요약 — 값 있을 때만 표시 */}
      {plaqueScore !== undefined && (
        <>
          <div className="border-t border-dashed border-gray-100 my-4" />
          <h4 className="text-sm font-semibold text-gray-800 mb-3">위험도 요약</h4>
          <div className="grid grid-cols-2 gap-3">
            <ToothStatusItem label="치태" score={plaqueScore} riskLevel={plaqueRisk!} />
            <ToothStatusItem label="치석" score={calculusScore!} riskLevel={calculusRisk!} />
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            {[
              { label: '낮음',     color: 'bg-[#4A86D9]' },
              { label: '보통',     color: 'bg-[#F0B65A]' },
              { label: '높음',     color: 'bg-[#EE8A86]' },
              { label: '매우 높음', color: 'bg-[#DC2626]' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}