'use client';

import type { LLMGuideSectionProps, GuideType } from './LLMGuideSection.types';

const getColor = (type: GuideType) => {
  if (type === 'warning') return '#F0B65A';
  if (type === 'danger') return '#EE8A86';
  return '#5FD3A8';
};

const getIcon = (type: GuideType) => {
  if (type === 'warning') return '●';
  if (type === 'danger') return '●';
  return '✓';
};

export default function LLMGuideSection({ items, isLoading = false }: LLMGuideSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-[#E8ECF4] rounded-full flex items-center justify-center">
          <span className="text-sm">🤖</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">AI 분석 리포트</h3>
          <p className="text-[10px] text-gray-400">AI가 분석한 내용을 요약하고 있어요...</p>
        </div>
      </div>
      <div className="bg-[#F8FAFC] rounded-xl p-4 flex flex-col gap-4">
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center">분석 중...</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-sm flex-shrink-0" style={{ color: getColor(item.type) }}>
                {getIcon(item.type)}
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-800 mb-0.5">{item.title}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}