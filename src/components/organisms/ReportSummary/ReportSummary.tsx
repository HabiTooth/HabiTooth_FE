'use client';

import type { ReportSummaryProps } from './ReportSummary.types';

export default function ReportSummary({ score, prevScore, grade, status }: ReportSummaryProps) {
  const diff = prevScore !== undefined ? score - prevScore : null;

  return (
    <div className="bg-white rounded-2xl p-5 mt-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-24 h-24 bg-[#E8ECF4] rounded-2xl">
          <span className="text-3xl font-bold text-[#4A86D9]">{score}</span>
          <span className="text-xs text-gray-400">구강 점수</span>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{status}</span>
          </div>
          {diff !== null && (
            <span className="text-xs text-gray-400">
              지난 측정 대비 {diff > 0 ? `+${diff}` : diff}
            </span>
          )}
          <div className="inline-flex items-center gap-1 bg-[#F0B65A]/20 px-2 py-1 rounded-full w-fit">
            <span className="text-xs font-semibold text-[#F0B65A]">등급 {grade}</span>
          </div>
        </div>
      </div>
    </div>
  );
}