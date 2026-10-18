'use client';

import TrendPlot from '@/components/molecules/TrendPlot';
import ReportBadge from '@/components/atoms/ReportBadge';
import type { TrendChartSectionProps } from './TrendChartSection.types';

export default function TrendChartSection({ data }: TrendChartSectionProps) {
  const latest = data[data.length - 1];
  const delta = data.length > 1 ? latest.score - data[data.length - 2].score : null;
  return (
    <section className="mt-4 rounded-[24px] border border-white bg-white p-5 shadow-[0_6px_24px_rgba(71,105,154,0.045)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[18px] font-bold tracking-[-0.4px] text-content">점수 변화 추이</h2>
        {data.length > 0 && <ReportBadge>최근 {data.length}회</ReportBadge>}
      </div>
      {data.length > 0 ? (
        <>
          <div className="mt-5 flex items-baseline gap-2">
            <strong className="text-[32px] font-bold leading-none tabular-nums text-[#597EB8]">
              {latest.score}
              <span className="ml-1 text-[14px]">점</span>
            </strong>
            <span className="text-[13px] font-semibold text-[#8292AB]">
              {delta === null
                ? '첫 측정'
                : delta === 0
                  ? '지난 측정과 같아요'
                  : `지난 측정 대비 ${delta > 0 ? '+' : '−'}${Math.abs(delta)}점`}
            </span>
          </div>
          <TrendPlot
            data={data.map((point) => ({ date: point.date, value: point.score }))}
            label="구강 점수 변화"
          />
          <p className="mb-0 mt-3 text-[12px] font-medium leading-relaxed text-[#788BA4]">
            측정한 날의 점수를 연결했어요.
          </p>
        </>
      ) : (
        <p className="mb-0 mt-5 py-5 text-center text-[14px] text-[#788BA4]">
          스캔 기록이 쌓이면 점수 변화를 볼 수 있어요.
        </p>
      )}
    </section>
  );
}
