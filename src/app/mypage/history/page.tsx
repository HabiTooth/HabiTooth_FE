'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';

const ALL_HISTORY = Array.from({ length: 35 }, (_, i) => {
  const date = new Date('2026-05-28');
  date.setDate(date.getDate() - i * 7);
  const score = Math.max(40, Math.floor(88 - i * 1.2 + (i % 3) * 4));
  const levels = ['낮음', '보통', '높음'] as const;
  return {
    id: String(i + 1),
    date: date.toISOString().slice(0, 10),
    score,
    plaque: levels[score >= 80 ? 0 : score >= 70 ? 1 : 2],
    tartar: levels[score >= 75 ? 0 : score >= 65 ? 1 : 2],
  };
});

const PER_PAGE = 20;
type SortKey = 'date' | 'score';
type PeriodFilter = 'all' | '1m' | '3m' | '6m';
type ScoreFilter = 'all' | 'good' | 'normal' | 'bad';

const PERIOD_LABELS: Record<PeriodFilter, string> = { all: '전체', '1m': '1개월', '3m': '3개월', '6m': '6개월' };
const SCORE_LABELS: Record<ScoreFilter, string> = { all: '전체', good: '80점↑', normal: '70~79점', bad: '70점↓' };

function riskColor(level: '낮음' | '보통' | '높음') {
  if (level === '높음') return 'text-danger';
  if (level === '보통') return 'text-[#B87F00]';
  return 'text-success';
}

function scoreColor(score: number) {
  if (score >= 80) return 'bg-success/15 text-success';
  if (score >= 70) return 'bg-warning/15 text-[#B87F00]';
  return 'bg-danger/15 text-danger';
}

export default function HistoryPage() {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');

  const filtered = ALL_HISTORY.filter((h) => {
    if (period !== 'all') {
      const months = period === '1m' ? 1 : period === '3m' ? 3 : 6;
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      if (new Date(h.date) < cutoff) return false;
    }
    if (scoreFilter === 'good' && h.score < 80) return false;
    if (scoreFilter === 'normal' && (h.score < 70 || h.score >= 80)) return false;
    if (scoreFilter === 'bad' && h.score >= 70) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const v = sortKey === 'date' ? a.date.localeCompare(b.date) : a.score - b.score;
    return sortAsc ? v : -v;
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const pageItems = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const resetPage = () => setPage(1);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); resetPage(); }
  };

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

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <ChevronDown size={12} className={`inline ml-0.5 transition-transform ${sortAsc ? 'rotate-180' : ''}`} />
    ) : null;

  return (
    <div className="max-w-[430px] min-h-svh mx-auto bg-background flex flex-col relative pb-16">
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
        <span className="ml-auto text-[12px] text-muted">{sorted.length}건</span>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="px-4 py-3 bg-white border-b border-hairline flex flex-col gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((k) => (
              <Chip key={k} active={period === k} label={PERIOD_LABELS[k]}
                onClick={() => { setPeriod(k); resetPage(); }} />
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {(Object.keys(SCORE_LABELS) as ScoreFilter[]).map((k) => (
              <Chip key={k} active={scoreFilter === k} label={SCORE_LABELS[k]}
                onClick={() => { setScoreFilter(k); resetPage(); }} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 px-4 py-2.5 bg-primary-light border-b border-hairline">
          <button type="button" onClick={() => toggleSort('date')}
            className="text-[11px] font-bold text-primary text-left bg-transparent border-none cursor-pointer p-0">
            날짜 <SortIcon k="date" />
          </button>
          <button type="button" onClick={() => toggleSort('score')}
            className="text-[11px] font-bold text-primary text-center bg-transparent border-none cursor-pointer p-0">
            점수 <SortIcon k="score" />
          </button>
          <span className="text-[11px] font-bold text-primary text-center">치태</span>
          <span className="text-[11px] font-bold text-primary text-center">치석</span>
        </div>

        <div className="flex-1 bg-white divide-y divide-hairline">
          {pageItems.map((h) => (
            <Link
              key={h.id}
              href={`/report/${h.id}`}
              className="grid grid-cols-4 px-4 py-3.5 items-center hover:bg-hairline/40 active:bg-hairline/60 transition-colors cursor-pointer no-underline"
            >
              <span className="text-[13px] text-content">{h.date}</span>
              <div className="flex justify-center">
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor(h.score)}`}>
                  {h.score}점
                </span>
              </div>
              <span className={`text-[12px] font-medium text-center ${riskColor(h.plaque)}`}>{h.plaque}</span>
              <span className={`text-[12px] font-medium text-center ${riskColor(h.tartar)}`}>{h.tartar}</span>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="bg-white border-t border-hairline px-4 py-3 flex items-center justify-center gap-1">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer disabled:opacity-30 hover:bg-hairline transition-colors">
              <ChevronLeft size={16} className="text-content" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-colors ${
                  p === page ? 'bg-primary text-white' : 'bg-transparent text-muted hover:bg-hairline'
                }`}>
                {p}
              </button>
            ))}
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
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