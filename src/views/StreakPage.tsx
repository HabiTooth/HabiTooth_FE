'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import { historyApi } from '@/lib/api/history';
import { useNotificationStore } from '@/stores/notificationStore';
import { streakReached } from '@/lib/notifications/rules';
import {
  DAY_LABELS,
  computeStreak,
  monthGrid,
  nextMilestone,
  streakMessage,
} from '@/lib/streak';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 py-4">
      <span className="text-2xl font-bold text-content tabular-nums">{value}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

export default function StreakPage() {
  const router = useRouter();
  const [dates, setDates] = useState<string[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const push = useNotificationStore((s) => s.push);

  useEffect(() => {
    historyApi
      .getList({ period: 'ALL', size: 200 })
      .then((res) => setDates((res.data.result?.items ?? []).map((i) => i.date)))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => computeStreak(dates), [dates]);

  const { current } = stats;
  useEffect(() => {
    const n = streakReached(current);
    if (n) push(n);
  }, [current, push]);

  const cells = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth(), stats.scanned),
    [cursor, stats.scanned],
  );

  const goal = nextMilestone(current);
  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const isThisMonth =
    cursor.getFullYear() === new Date().getFullYear() &&
    cursor.getMonth() === new Date().getMonth();

  return (
    <PageShell className="pb-16">
      <div className="flex items-center px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-hairline">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
        >
          <ChevronLeft size={20} className="text-content" />
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-content">스캔 기록</span>
        <div className="w-9" />
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="bg-gradient-to-br from-[#4A86D9] to-[#7EB8F7] rounded-[20px] shadow-card p-6 text-white flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Flame size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="m-0 text-sm opacity-90">연속 스캔</p>
            <p className="m-0 text-4xl font-bold leading-tight tabular-nums">
              {current}
              <span className="text-lg font-semibold opacity-80 ml-1">일</span>
            </p>
            <p className="m-0 mt-1 text-xs opacity-90">{streakMessage(current)}</p>
          </div>
        </div>

        {goal !== null && (
          <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-content">다음 목표 {goal}일</span>
              <span className="text-xs text-muted tabular-nums">
                {current} / {goal}
              </span>
            </div>
            <div className="w-full h-2 bg-hairline rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full bg-primary-gradient transition-[width] duration-500"
                style={{ width: `${Math.min(100, (current / goal) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card flex divide-x divide-hairline">
          <Stat value={String(stats.longest)} label="최장 연속" />
          <Stat value={String(stats.totalDays)} label="스캔한 날" />
          <Stat
            value={String(
              [...stats.scanned].filter((k) =>
                k.startsWith(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`),
              ).length,
            )}
            label="이번 달"
          />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
            >
              <ChevronLeft size={18} className="text-muted" />
            </button>
            <span className="text-sm font-semibold text-content">
              {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              disabled={isThisMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-hairline transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} className="text-muted" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map((d) => (
              <span key={d} className="text-center text-[10px] text-muted py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => (
              <div
                key={cell.key ?? `pad-${i}`}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs tabular-nums ${
                  cell.day === null
                    ? ''
                    : cell.scanned
                      ? 'bg-primary text-white font-semibold'
                      : cell.isFuture
                        ? 'text-muted/40'
                        : 'bg-hairline/50 text-muted'
                } ${cell.isToday && !cell.scanned ? 'ring-1 ring-primary text-primary' : ''}`}
              >
                {cell.day ?? ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      <NavBar activeTab="home" />
    </PageShell>
  );
}
