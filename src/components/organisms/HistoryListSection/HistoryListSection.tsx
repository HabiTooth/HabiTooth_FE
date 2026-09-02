'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import MoreLink from '@/components/atoms/MoreLink';
import { RISK_INK } from '@/lib/riskColors';
import type { HistoryItem, HistoryListSectionProps } from './HistoryListSection.types';

const GRADE_COLOR: Record<string, string> = {
  A: RISK_INK.VERY_LOW,
  B: RISK_INK.LOW,
  C: RISK_INK.MEDIUM,
  D: RISK_INK.HIGH,
  F: RISK_INK.CRITICAL,
};

function Row({ item }: { item: HistoryItem }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#F0F4FF] rounded-xl flex items-center justify-center">
          <span className="text-lg">🦷</span>
        </div>
        <div>
          <p className="m-0 text-xs font-medium text-gray-800">{item.date}</p>
          <p className="m-0 text-[10px] text-gray-400">{item.time}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="m-0 text-xs text-gray-400">구강 점수</p>
          <p className="m-0 text-sm font-bold text-[#4A86D9]">
            {item.score}
            <span className="text-xs font-normal text-gray-400">/100</span>
          </p>
        </div>
        <div className="text-sm font-bold" style={{ color: GRADE_COLOR[item.grade] ?? '#8A94A6' }}>
          {item.grade}
        </div>
        {item.sessionId != null && <ChevronRight size={14} className="text-gray-300" />}
      </div>
    </>
  );
}

export default function HistoryListSection({ items }: HistoryListSectionProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="m-0 text-sm font-semibold text-gray-800">지난 측정 기록</h2>
        <Link href="/mypage/history" className="no-underline">
          <MoreLink label="전체 보기" />
        </Link>
      </div>
      {items.length === 0 && (
        <p className="m-0 py-6 text-center text-[12px] text-muted">
          아직 스캔 기록이 없어요. 첫 스캔을 하면 여기에 쌓여요.
        </p>
      )}
      <div className="space-y-3">
        {items.map((item, index) =>
          item.sessionId == null ? (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-none"
            >
              <Row item={item} />
            </div>
          ) : (
            <Link
              key={index}
              href={`/report/${item.sessionId}`}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-none no-underline -mx-2 px-2 rounded-lg transition-colors active:bg-gray-100"
            >
              <Row item={item} />
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
