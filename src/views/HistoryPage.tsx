'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/organisms/Header';
import NavBar from '@/components/organisms/NavBar';
import TrendChartSection from '@/components/organisms/TrendChartSection';
import {
  historyApi,
  type HistoryList,
  type HistoryPeriodFilter,
  type HistoryScoreFilter,
  type HistoryScoreTrendItem,
  type HistoryToday,
} from '@/lib/api/history';
import { RISK_LABEL, formatDate, formatShortDate, formatTime, scoreGrade } from '@/lib/score';

const PERIODS: Array<{ value: HistoryPeriodFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'ONE_MONTH', label: '1개월' },
  { value: 'THREE_MONTHS', label: '3개월' },
  { value: 'SIX_MONTHS', label: '6개월' },
];

const SCORES: Array<{ value: HistoryScoreFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'HIGH', label: '80점 이상' },
  { value: 'MEDIUM', label: '70~79점' },
  { value: 'LOW', label: '70점 미만' },
];

function FilterRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            value === o.value ? 'bg-[#4A86D9] text-white' : 'bg-white text-gray-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const [today, setToday] = useState<HistoryToday | null>(null);
  const [trend, setTrend] = useState<HistoryScoreTrendItem[]>([]);
  const [list, setList] = useState<HistoryList | null>(null);
  const [period, setPeriod] = useState<HistoryPeriodFilter>('ALL');
  const [scoreFilter, setScoreFilter] = useState<HistoryScoreFilter>('ALL');
  const [page, setPage] = useState(0);

  useEffect(() => {
    historyApi.getToday().then((res) => setToday(res.data.result)).catch(() => {});
    historyApi.getScoreTrend().then((res) => setTrend(res.data.result)).catch(() => {});
  }, []);

  useEffect(() => {
    historyApi
      .getList({ period, scoreFilter, page })
      .then((res) => setList(res.data.result))
      .catch(() => setList(null));
  }, [period, scoreFilter, page]);

  const changePeriod = (v: HistoryPeriodFilter) => {
    setPeriod(v);
    setPage(0);
  };

  const changeScore = (v: HistoryScoreFilter) => {
    setScoreFilter(v);
    setPage(0);
  };

  return (
    <main className="max-w-[430px] mx-auto p-6 bg-[#EEF2FF] min-h-screen pb-20">
      <Header />

      {today && (
        <div className="bg-white rounded-2xl p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">오늘의 기록</h3>
            <span className="text-xs text-gray-400">
              {formatDate(today.date)} {formatTime(today.time)}
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-[#4A86D9] leading-none">{today.score}</span>
            <div className="flex flex-col gap-1 pb-1">
              <span className="text-sm font-semibold text-gray-800">
                {RISK_LABEL[today.riskLevel]}
              </span>
              {today.scoreDiff !== null && (
                <span className="text-xs text-gray-400">
                  지난 결과 대비 {today.scoreDiff > 0 ? `+${today.scoreDiff}` : today.scoreDiff}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <TrendChartSection
        data={trend.map((t) => ({ date: formatShortDate(t.date), score: t.score }))}
      />

      <div className="bg-white rounded-2xl p-5 mt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">전체 기록</h3>

        <div className="flex flex-col gap-2 mb-4">
          <FilterRow options={PERIODS} value={period} onChange={changePeriod} />
          <FilterRow options={SCORES} value={scoreFilter} onChange={changeScore} />
        </div>

        {list && list.items.length > 0 ? (
          <>
            <ul className="m-0 p-0 list-none divide-y divide-gray-100">
              {list.items.map((item, i) => (
                <li key={`${item.date}-${i}`}>
                  <div className="w-full flex items-center justify-between py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-gray-800">{formatDate(item.date)}</span>
                      <span className="text-[11px] text-gray-400">
                        치태 {RISK_LABEL[item.plaqueRiskLevel]} · 치석{' '}
                        {RISK_LABEL[item.calculusRiskLevel]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{item.score}</span>
                      <span className="text-[11px] font-bold text-[#4A86D9] bg-[#EEF2FF] rounded-full px-2 py-0.5">
                        {scoreGrade(item.score)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {list.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-xs text-gray-500 bg-transparent border-none cursor-pointer disabled:opacity-30"
                >
                  이전
                </button>
                <span className="text-xs text-gray-400 tabular-nums">
                  {page + 1} / {list.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= list.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs text-gray-500 bg-transparent border-none cursor-pointer disabled:opacity-30"
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="m-0 py-8 text-center text-sm text-gray-400">기록이 없어요.</p>
        )}
      </div>

      <NavBar activeTab="history" />
    </main>
  );
}
