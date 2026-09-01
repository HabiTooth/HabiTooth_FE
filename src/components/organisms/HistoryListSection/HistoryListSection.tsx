'use client';

import Link from 'next/link';
import type { HistoryListSectionProps } from './HistoryListSection.types';

const getGradeColor = (grade: string) => {
  if (grade === 'A') return 'text-[#4A86D9]';
  if (grade === 'B') return 'text-[#F0B65A]';
  if (grade === 'C') return 'text-[#E8542A]';
  return 'text-gray-400';
};

export default function HistoryListSection({ items }: HistoryListSectionProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">지난 측정 기록</h2>
        <Link href="/mypage/history" className="text-xs text-[#4A86D9]">
          전체 보기 &gt;
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F0F4FF] rounded-xl flex items-center justify-center">
                <span className="text-lg">🦷</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">{item.date}</p>
                <p className="text-[10px] text-gray-400">{item.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">구강 점수</p>
                <p className="text-sm font-bold text-[#4A86D9]">{item.score}<span className="text-xs font-normal text-gray-400">/100</span></p>
              </div>
              <div className={`text-sm font-bold ${getGradeColor(item.grade)}`}>
                {item.grade}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}