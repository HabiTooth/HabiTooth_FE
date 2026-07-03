'use client';

import OralViewer3D from '@/components/organisms/OralViewer3D';
import type { RiskAnalysisSectionProps } from './RiskAnalysisSection.types';

export default function RiskAnalysisSection({ plaque, calculus, analysisResults = [], calibrationMode = false }: RiskAnalysisSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-5 mt-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">위험 부위 분석</h2>

      <div className="bg-[#F0F4FF] rounded-xl overflow-hidden h-64 mb-4">
        <OralViewer3D analysisResults={analysisResults} calibrationMode={calibrationMode} />
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623] inline-block" />
              <span className="text-xs text-gray-700">치태</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">{plaque}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full bg-[#F5A623]" style={{ width: `${plaque}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8542A] inline-block" />
              <span className="text-xs text-gray-700">치석</span>
            </div>
            <span className="text-xs font-semibold text-gray-800">{calculus}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full bg-[#E8542A]" style={{ width: `${calculus}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}