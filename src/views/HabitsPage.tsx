'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, Lightbulb } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import { historyApi } from '@/lib/api/history';
import { useHabitStore } from '@/stores/habitStore';
import {
  HABITS,
  completionRate,
  currentHabitStreak,
  doneOn,
  insight,
  recentKeys,
} from '@/lib/habits';
import { toKey } from '@/lib/streak';

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function HabitsPage() {
  const router = useRouter();
  const { log, hydrate, toggleHabit } = useHabitStore();
  const [scans, setScans] = useState<Array<{ date: string; score: number }>>([]);

  useEffect(() => {
    hydrate();
    historyApi
      .getScoreTrend()
      .then((res) => setScans(res.data.result ?? []))
      .catch(() => {});
  }, [hydrate]);

  const todayKey = toKey(new Date());
  const done = doneOn(log, todayKey);
  const week = useMemo(() => recentKeys(7), []);
  const weekRate = completionRate(log, week);
  const streak = currentHabitStreak(log);
  const tip = useMemo(() => insight(log, scans), [log, scans]);

  return (
    <PageShell withNav>
      <div className="flex items-center px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-hairline">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
        >
          <ChevronLeft size={20} className="text-content" />
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-content">
          구강 습관
        </span>
        <div className="w-9" />
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="m-0 text-sm font-semibold text-content">오늘 할 일</h2>
            <span className="text-xs text-muted tabular-nums">
              {done.length} / {HABITS.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {HABITS.map((habit) => {
              const checked = done.includes(habit.id);
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleHabit(todayKey, habit.id)}
                  aria-pressed={checked}
                  className={`flex items-center gap-3 p-3 rounded-[14px] border transition-colors text-left ${
                    checked ? 'bg-primary-light border-primary/30' : 'bg-white border-hairline'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      checked ? 'bg-primary text-white' : 'border-2 border-hairline'
                    }`}
                  >
                    {checked && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-[13px] font-medium ${checked ? 'text-primary' : 'text-content'}`}
                    >
                      {habit.label}
                    </span>
                    <span className="block text-[11px] text-muted">{habit.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="m-0 text-sm font-semibold text-content">최근 7일</h2>
            <span className="text-xs text-muted tabular-nums">
              달성률 {Math.round(weekRate * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {week.map((key) => {
              const rate = doneOn(log, key).length / HABITS.length;
              const day = new Date(key).getDay();
              return (
                <div key={key} className="flex flex-col items-center gap-1">
                  <div className="w-full aspect-square rounded-lg bg-hairline/60 overflow-hidden flex items-end">
                    <div
                      className="w-full bg-primary-gradient transition-[height] duration-300"
                      style={{ height: `${rate * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{WEEK_LABELS[day]}</span>
                </div>
              );
            })}
          </div>

          {streak > 0 && (
            <p className="m-0 mt-3 text-xs text-muted">
              {streak}일 연속으로 전부 지키고 있어요.
            </p>
          )}
        </div>

        <div
          className={`rounded-[20px] shadow-card p-4 flex items-start gap-3 backdrop-blur-sm ${
            tip.strong ? 'bg-success/10' : 'bg-white/90'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              tip.strong ? 'bg-success/20 text-success' : 'bg-primary-light text-primary'
            }`}
          >
            <Lightbulb size={16} />
          </div>
          <p className="m-0 text-[12px] text-content leading-relaxed pt-1.5">{tip.text}</p>
        </div>
      </div>

      <NavBar activeTab="home" />
    </PageShell>
  );
}
