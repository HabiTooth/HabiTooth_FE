'use client';

import ToothStatusItem from '@/components/molecules/ToothStatusItem';
import type { RiskSummaryProps } from './RiskSummary.types';

export default function RiskSummary({ plaqueScore, calculusScore, gumScore, plaqueRisk, calculusRisk, gumRisk }: RiskSummaryProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">위험도 요약</h3>
        <button className="text-xs text-gray-400">자세히 보기 &gt;</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ToothStatusItem label="치태" score={plaqueScore} riskLevel={plaqueRisk} />
        <ToothStatusItem label="치석" score={calculusScore} riskLevel={calculusRisk} />
        <ToothStatusItem label="잇몸 건강" score={gumScore} riskLevel={gumRisk} />
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4A86D9]" />
          <span className="text-[10px] text-gray-400">낮음</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F0B65A]" />
          <span className="text-[10px] text-gray-400">보통</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EE8A86]" />
          <span className="text-[10px] text-gray-400">높음</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          <span className="text-[10px] text-gray-400">매우 높음</span>
        </div>
      </div>
    </div>
  );
}