'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import OralViewer3D from '@/components/organisms/OralViewer3D';
import type { ToothAnalysisResult } from '@/components/organisms/OralViewer3D/ThreeScene';
import { reportApi, type SessionReport } from '@/lib/api/report';
import { useSessionIndex } from '@/hooks/useSessionIndex';
import { compareSummary, compareTeeth, type ToothChange } from '@/lib/compare';
import { RISK_LABEL, formatDateTime } from '@/lib/score';

const toViewerResults = (report: SessionReport | null): ToothAnalysisResult[] =>
  (report?.toothStatuses ?? []).map((t) => ({
    toothNumber: String(t.toothNumber),
    lesionType: t.lesionType ?? '',
    areaRatio: t.areaRatio,
    riskLevel: t.riskLevel as ToothAnalysisResult['riskLevel'],
  }));

function ChangeRow({ change, tone }: { change: ToothChange; tone: 'good' | 'bad' }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-12 text-[12px] font-semibold text-content tabular-nums">
        {change.toothNumber}번
      </span>
      <span className="text-[11px] text-muted">{RISK_LABEL[change.before]}</span>
      <ArrowRight size={11} className="text-muted flex-shrink-0" />
      <span
        className={`text-[11px] font-semibold ${tone === 'good' ? 'text-success' : 'text-danger'}`}
      >
        {RISK_LABEL[change.after]}
      </span>
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const { sessions, loading: finding } = useSessionIndex();
  const [beforeId, setBeforeId] = useState<number | null>(null);
  const [afterId, setAfterId] = useState<number | null>(null);
  const [before, setBefore] = useState<SessionReport | null>(null);
  const [after, setAfter] = useState<SessionReport | null>(null);
  const [showing, setShowing] = useState<'before' | 'after'>('after');
  useEffect(() => {
    if (sessions.length < 2 || afterId !== null) return;
    setAfterId(sessions[0].sessionId);
    setBeforeId(sessions[1].sessionId);
  }, [sessions, afterId]);

  useEffect(() => {
    if (beforeId === null) return;
    reportApi
      .getSessionReport(beforeId)
      .then((res) => setBefore(res.data.result))
      .catch(() => setBefore(null));
  }, [beforeId]);

  useEffect(() => {
    if (afterId === null) return;
    reportApi
      .getSessionReport(afterId)
      .then((res) => setAfter(res.data.result))
      .catch(() => setAfter(null));
  }, [afterId]);

  const diff = useMemo(
    () =>
      compareTeeth(
        (before?.toothStatuses ?? []).map((t) => ({
          toothNumber: t.toothNumber,
          riskLevel: t.riskLevel,
        })),
        (after?.toothStatuses ?? []).map((t) => ({
          toothNumber: t.toothNumber,
          riskLevel: t.riskLevel,
        })),
      ),
    [before, after],
  );

  const scoreDelta =
    before && after ? after.totalScore - before.totalScore : null;

  const shown = showing === 'after' ? after : before;
  const ready = before !== null && after !== null;

  const Select = ({
    value,
    onChange,
    label,
  }: {
    value: number | null;
    onChange: (id: number) => void;
    label: string;
  }) => (
    <label className="flex-1 min-w-0 flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-muted">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-10 px-2 rounded-[12px] border border-hairline bg-white text-[12px] text-content"
      >
        {sessions.map((s) => (
          <option key={s.sessionId} value={s.sessionId}>
            {formatDateTime(s.scannedAt) || `세션 ${s.sessionId}`}
          </option>
        ))}
      </select>
    </label>
  );

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
          스캔 비교
        </span>
        <div className="w-9" />
      </div>

      {finding ? (
        <div className="px-5 pt-16 flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin text-primary" />
          <p className="m-0 text-[12px] text-muted">지난 스캔을 찾고 있어요</p>
        </div>
      ) : sessions.length < 2 ? (
        <div className="px-5 pt-16 flex flex-col items-center gap-2">
          <p className="m-0 text-sm text-muted">비교하려면 스캔이 2번 이상 필요해요.</p>
          <button
            type="button"
            onClick={() => router.push('/scan')}
            className="mt-2 px-4 py-2 rounded-full bg-primary-gradient text-white text-xs font-semibold"
          >
            스캔하러 가기
          </button>
        </div>
      ) : (
        <div className="px-5 pt-4 flex flex-col gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-4 flex items-end gap-2">
            <Select value={beforeId} onChange={setBeforeId} label="기준" />
            <ArrowRight size={16} className="text-muted mb-3 flex-shrink-0" />
            <Select value={afterId} onChange={setAfterId} label="비교" />
          </div>

          {ready && (
            <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-muted tabular-nums">
                    {before!.totalScore}
                  </span>
                  <ArrowRight size={16} className="text-muted" />
                  <span className="text-3xl font-bold text-primary tabular-nums">
                    {after!.totalScore}
                  </span>
                </div>
                {scoreDelta !== null && scoreDelta !== 0 && (
                  <span
                    className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-bold ${
                      scoreDelta > 0
                        ? 'bg-success/15 text-success'
                        : 'bg-danger/15 text-danger'
                    }`}
                  >
                    {scoreDelta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {scoreDelta > 0 ? '+' : ''}
                    {scoreDelta}
                  </span>
                )}
              </div>
              <p className="m-0 mt-2 text-[12px] text-muted">
                {compareSummary(diff, scoreDelta)}
              </p>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
            <div className="flex bg-hairline/60 rounded-full p-1 mb-3">
              {(['before', 'after'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setShowing(key)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    showing === key ? 'bg-white text-primary shadow-sm' : 'text-muted'
                  }`}
                >
                  {key === 'before' ? '기준' : '비교'}
                </button>
              ))}
            </div>

            <p className="m-0 mb-2 text-[11px] text-muted">
              카메라를 돌려둔 채로 전환하면 같은 각도에서 변화가 보여요.
            </p>

            <div className="bg-[#F0F4FF] rounded-xl overflow-hidden h-[300px]">
              <OralViewer3D analysisResults={toViewerResults(shown)} />
            </div>
          </div>

          {ready && (diff.improved.length > 0 || diff.worsened.length > 0) && (
            <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
              <h2 className="m-0 text-sm font-semibold text-content mb-3">치아별 변화</h2>

              {diff.improved.length > 0 && (
                <div className="mb-3">
                  <p className="m-0 mb-1 text-[11px] font-bold text-success">
                    좋아짐 {diff.improved.length}
                  </p>
                  <div className="divide-y divide-hairline">
                    {diff.improved.map((c) => (
                      <ChangeRow key={c.toothNumber} change={c} tone="good" />
                    ))}
                  </div>
                </div>
              )}

              {diff.worsened.length > 0 && (
                <div>
                  <p className="m-0 mb-1 text-[11px] font-bold text-danger">
                    나빠짐 {diff.worsened.length}
                  </p>
                  <div className="divide-y divide-hairline">
                    {diff.worsened.map((c) => (
                      <ChangeRow key={c.toothNumber} change={c} tone="bad" />
                    ))}
                  </div>
                </div>
              )}

              {diff.onlyInAfter.length > 0 && (
                <p className="m-0 mt-3 text-[10px] text-muted leading-relaxed">
                  {diff.onlyInAfter.join(', ')}번은 기준 스캔에 없어서 비교에서 뺐어요. 두 스캔의
                  촬영 구역이 달랐어요.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <NavBar activeTab="home" />
    </PageShell>
  );
}
