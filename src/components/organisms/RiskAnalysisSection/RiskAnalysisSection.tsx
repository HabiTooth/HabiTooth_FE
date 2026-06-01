'use client';

import type { RiskAnalysisSectionProps } from './RiskAnalysisSection.types';

export default function RiskAnalysisSection({ plaque, calculus }: RiskAnalysisSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-5 mt-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">위험 부위 분석</h2>

      {/* 3D 뷰어 placeholder */}
      <div className="bg-[#F0F4FF] rounded-xl flex items-center justify-center h-40 mb-4">
        <p className="text-xs text-gray-400">3D 치아 뷰어 (준비 중)</p>
      </div>

      {/* 탐지 항목 */}
      <div className="space-y-3">
        {/* 치태 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623] inline-block" />
              <span className="text-xs text-gray-700">치태</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">{plaque}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-[#F5A623]"
              style={{ width: `${plaque}%` }}
            />
          </div>
        </div>

        {/* 치석 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8542A] inline-block" />
              <span className="text-xs text-gray-700">치석</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">{calculus}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-[#E8542A]"
              style={{ width: `${calculus}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}