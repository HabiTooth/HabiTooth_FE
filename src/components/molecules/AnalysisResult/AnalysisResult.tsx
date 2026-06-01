'use client';

import type { AnalysisResultProps } from './AnalysisResult.types';

const getRiskLabel = (risk: 'low' | 'normal' | 'high' | 'very-high') => {
  if (risk === 'low') return '낮음';
  if (risk === 'normal') return '보통';
  if (risk === 'high') return '높음';
  return '매우 높음';
};

const getRiskColor = (risk: 'low' | 'normal' | 'high' | 'very-high') => {
  if (risk === 'low') return '#4A86D9';
  if (risk === 'normal') return '#F0B65A';
  if (risk === 'high') return '#EE8A86';
  return '#DC2626';
};

export default function AnalysisResult({ date, time, score, plaqueRisk, calculusRisk }: AnalysisResultProps) {
  return (
    <div className="bg-white rounded-2xl p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">최근 분석 결과</h3>
        <button className="text-xs text-gray-400">전체 보기 &gt;</button>
      </div>
      <div className="flex gap-3">
        <div className="w-20 h-20 bg-[#E8ECF4] rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">🦷</span>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="pb-2 mb-2 border-b border-gray-200">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 whitespace-nowrap">{date} {time}</span>
              <span className="text-[10px] bg-[#4A86D9] text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">최신</span>
            </div>
          </div>
          <div className="flex items-center flex-1">
            <div className="flex flex-col gap-0.5 pr-3 border-r border-gray-200 flex-1 items-center">
              <p className="text-[10px] text-gray-400">종합 점수</p>
              <div className="flex items-end gap-0.5">
                <span className="text-xl font-bold text-[#4A86D9]">{score}</span>
                <span className="text-[10px] text-gray-400 mb-0.5">/100</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pl-3 flex-1 items-center justify-center">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getRiskColor(plaqueRisk) }} />
                <span className="text-[10px] text-gray-600">치태 위험</span>
                <span className="text-[10px] font-medium" style={{ color: getRiskColor(plaqueRisk) }}>{getRiskLabel(plaqueRisk)}</span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getRiskColor(calculusRisk) }} />
                <span className="text-[10px] text-gray-600">치석 위험</span>
                <span className="text-[10px] font-medium" style={{ color: getRiskColor(calculusRisk) }}>{getRiskLabel(calculusRisk)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}