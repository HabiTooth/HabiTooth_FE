'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';
import {
  historyApi,
  type HistoryList,
  type HistoryPeriodFilter,
  type HistoryScoreFilter,
} from '@/lib/api/history';
import { userApi } from '@/lib/api/user';
import type { RiskLevel } from '@/lib/api/common';
import { RISK_LABEL, formatDate } from '@/lib/score';

const PERIOD_LABELS: Record<HistoryPeriodFilter, string> = {
  ALL: '전체',
  ONE_MONTH: '1개월',
  THREE_MONTHS: '3개월',
  SIX_MONTHS: '6개월',
};

const SCORE_LABELS: Record<HistoryScoreFilter, string> = {
  ALL: '전체',
  HIGH: '80점↑',
  MEDIUM: '70~79점',
  LOW: '70점↓',
};

function riskColor(level: RiskLevel) {
  if (level === 'CRITICAL' || level === 'HIGH') return 'text-danger';
  if (level === 'MEDIUM') return 'text-[#B87F00]';
  return 'text-success';
}

function scoreColor(score: number) {
  if (score >= 80) return 'bg-success/15 text-success';
  if (score >= 70) return 'bg-warning/15 text-[#B87F00]';
  return 'bg-danger/15 text-danger';
}

export default function HistoryListPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [period, setPeriod] = useState<HistoryPeriodFilter>('ALL');
  const [scoreFilter, setScoreFilter] = useState<HistoryScoreFilter>('ALL');
  const [data, setData] = useState<HistoryList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    historyApi
      .getList({ period, scoreFilter, page, size: 20 })
      .then((res) => setData(res.data.result))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [period, scoreFilter, page, reloadKey]);

  const handleDeleteAll = async () => {
    if (!window.confirm('기록을 전부 삭제할까요? 되돌릴 수 없어요.')) return;
    setIsDeleting(true);
    try {
      await userApi.deleteData();
      setPage(0);
      setReloadKey((k) => k + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = data?.totalPages ?? 0;

  const Chip = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors whitespace-nowrap ${
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-white text-muted border-hairline hover:border-primary/40'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-[430px] min-h-svh mx-auto bg-background flex flex-col relative pb-28">
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />

      <div className="flex items-center px-4 py-3 bg-white border-b border-hairline flex-shrink-0 relative z-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors bg-transparent border-none cursor-pointer"
        >
          <ChevronLeft size={20} className="text-content" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-content">
          기록 이력
        </span>
        <span className="ml-auto text-[12px] text-muted">{data?.totalCount ?? 0}건</span>
        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={isDeleting || (data?.totalCount ?? 0) === 0}
          className="ml-3 text-[12px] font-semibold text-danger bg-transparent border-none cursor-pointer disabled:opacity-30"
        >
          {isDeleting ? '삭제 중...' : '전체 삭제'}
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="px-4 py-3 bg-white border-b border-hairline flex flex-col gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {(Object.keys(PERIOD_LABELS) as HistoryPeriodFilter[]).map((k) => (
              <Chip key={k} active={period === k} label={PERIOD_LABELS[k]}
                onClick={() => { setPeriod(k); setPage(0); }} />
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {(Object.keys(SCORE_LABELS) as HistoryScoreFilter[]).map((k) => (
              <Chip key={k} active={scoreFilter === k} label={SCORE_LABELS[k]}
                onClick={() => { setScoreFilter(k); setPage(0); }} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 px-4 py-2.5 bg-primary-light border-b border-hairline">
          <span className="text-[11px] font-bold text-primary">날짜</span>
          <span className="text-[11px] font-bold text-primary text-center">점수</span>
          <span className="text-[11px] font-bold text-primary text-center">치태</span>
          <span className="text-[11px] font-bold text-primary text-center">치석</span>
        </div>

        <div className="flex-1 bg-white divide-y divide-hairline">
          {isLoading && (
            <p className="m-0 py-12 text-center text-[13px] text-muted">불러오는 중...</p>
          )}
          {!isLoading && (data?.items.length ?? 0) === 0 && (
            <p className="m-0 py-12 text-center text-[13px] text-muted">기록이 없어요.</p>
          )}
          {data?.items.map((h, i) => (
            <div key={`${h.date}-${i}`} className="grid grid-cols-4 px-4 py-3.5 items-center">
              <span className="text-[13px] text-content">{formatDate(h.date)}</span>
              <div className="flex justify-center">
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor(h.score)}`}>
                  {h.score}점
                </span>
              </div>
              <span className={`text-[12px] font-medium text-center ${riskColor(h.plaqueRiskLevel)}`}>
                {RISK_LABEL[h.plaqueRiskLevel]}
              </span>
              <span className={`text-[12px] font-medium text-center ${riskColor(h.calculusRiskLevel)}`}>
                {RISK_LABEL[h.calculusRiskLevel]}
              </span>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="bg-white border-t border-hairline px-4 py-3 flex items-center justify-center gap-1">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer disabled:opacity-30 hover:bg-hairline transition-colors">
              <ChevronLeft size={16} className="text-content" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
              <button key={p} type="button" onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-colors ${
                  p === page ? 'bg-primary text-white' : 'bg-transparent text-muted hover:bg-hairline'
                }`}>
                {p + 1}
              </button>
            ))}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer disabled:opacity-30 hover:bg-hairline transition-colors">
              <ChevronRight size={16} className="text-content" />
            </button>
          </div>
        )}
      </div>
      <NavBar activeTab="history" />
    </div>
  );
}
