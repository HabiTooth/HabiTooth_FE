'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import MoreLink from '@/components/atoms/MoreLink';
import { useHabitStore } from '@/stores/habitStore';
import { HABITS, completionRate, doneOn, recentKeys } from '@/lib/habits';

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function HabitSummarySection() {
  const { log, hydrate } = useHabitStore();

  useEffect(() => hydrate(), [hydrate]);

  const week = useMemo(() => recentKeys(7), []);
  const rate = completionRate(log, week);
  const empty = week.every((key) => doneOn(log, key).length === 0);

  return (
    <Link
      href="/habits"
      className="block bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mt-4 no-underline"
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="m-0 text-sm font-semibold text-content">최근 일주일 관리 습관</h2>
        <MoreLink />
      </div>

      {empty ? (
        <p className="m-0 mb-3 text-[11px] text-muted">
          양치·치실을 기록해두면 점수 변화의 이유를 같이 볼 수 있어요.
        </p>
      ) : (
        <p className="m-0 mb-3 text-[11px] text-muted">
          달성률 {Math.round(rate * 100)}%
        </p>
      )}

      <div className="grid grid-cols-7 gap-1.5">
        {week.map((key) => {
          const done = doneOn(log, key).length / HABITS.length;
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <div className="w-full aspect-square rounded-lg bg-hairline/60 overflow-hidden flex items-end">
                <div
                  className="w-full bg-primary-gradient transition-[height] duration-300"
                  style={{ height: `${done * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted">{WEEK_LABELS[new Date(key).getDay()]}</span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
