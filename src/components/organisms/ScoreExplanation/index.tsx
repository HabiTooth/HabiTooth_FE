import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { LlmReport } from '@/lib/api/report';

const actionHref = (code: string) => {
  if (code === 'SCALING') return '/clinics';
  if (code === 'RECAPTURE') return '/scan';
  return '/products';
};

const MARKER = ['#F0DB98', '#C9DDF6', '#D6E6DD'];
const CARD =
  'mt-4 rounded-[24px] border border-white bg-white p-5 shadow-[0_6px_24px_rgba(71,105,154,0.045)]';

export default function ScoreExplanation({
  report,
  section = 'all',
}: {
  report: LlmReport;
  section?: 'all' | 'score' | 'actions';
}) {
  const score = report.score;
  const segments = score
    ? [
        { label: '종합 점수', value: score.total, color: '#738DC8' },
        { label: '치석 감점', value: score.calculusDeduction, color: '#CF9EAC' },
        { label: '치태 감점', value: score.plaqueDeduction, color: '#D8BE86' },
      ]
    : [];
  return (
    <>
      {section !== 'actions' && score && (
        <section className={CARD}>
          <h2 className="m-0 text-[18px] font-bold tracking-[-0.4px] text-content">
            {score.total}점은 이렇게 나왔어요
          </h2>
          <div
            className="mb-3 mt-5 flex h-3 overflow-hidden rounded-full bg-[#EEF2F7]"
            role="img"
            aria-label={segments.map((s) => `${s.label} ${s.value}점`).join(', ')}
          >
            {segments.map((segment) => (
              <span
                key={segment.label}
                style={{
                  width: `${Math.max(0, Math.min(100, segment.value))}%`,
                  backgroundColor: segment.color,
                }}
              />
            ))}
          </div>
          <ul
            aria-label="점수 막대 범례"
            className="mb-5 mt-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0"
          >
            {segments.map((segment) => (
              <li
                key={segment.label}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#4E607B]"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
                {segment.label}
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 divide-x divide-hairline">
            {[
              {
                label: '치석',
                count: score.calculusToothCount,
                deduction: score.calculusDeduction,
                hint: '스케일링으로만 회복',
                color: '#A76F85',
              },
              {
                label: '치태',
                count: score.plaqueToothCount,
                deduction: score.plaqueDeduction,
                hint: '칫솔질로 회복',
                color: '#967D48',
              },
            ].map((item, i) => (
              <div key={item.label} className={i === 0 ? 'pr-3' : 'pl-4'}>
                <p className="m-0 text-[13px] font-semibold text-[#4E607B]">
                  {item.label} · 치아 {item.count}개
                </p>
                <p
                  className="mb-2 mt-2 text-[32px] font-bold leading-none tracking-[-1px] tabular-nums"
                  style={{ color: item.color }}
                >
                  −{item.deduction}
                  <span className="ml-1 text-[13px] tracking-normal">점</span>
                </p>
                <p className="m-0 text-[13px] font-medium leading-relaxed text-[#4E607B]">
                  {item.hint}
                </p>
              </div>
            ))}
          </div>
          {!!report.interpretation?.length && (
            <div className="relative mt-6 overflow-hidden rounded-[16px] border border-[#E2E8F1] bg-[#EDF2FC] px-4 pb-4 pt-5">
              <span
                className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-[#D5E2F5]"
                aria-hidden
              />
              <h3 className="mb-3 mt-0 flex items-center gap-2 text-[14px] font-bold text-[#4A7DBD]">
                <span
                  className="rounded-md bg-[#EAF0F9] px-1.5 py-1 text-[10px] font-bold tracking-wide text-[#4C7EC8]"
                  aria-hidden
                >
                  AI
                </span>
                AI 가이드
              </h3>
              <div
                className="border-l border-[#E1C9D0] pl-3.5"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent 0, transparent 27px, #E5EBF5 27px, #E5EBF5 28px)',
                }}
              >
                {report.interpretation.slice(0, 3).map((text, i) => (
                  <p
                    key={i}
                    className="m-0 pb-7 last:pb-0 break-keep text-[14px] font-medium leading-7 text-content"
                  >
                    {text}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 space-y-4 rounded-[18px] bg-[#F4F7FB] p-4">
            <p className="m-0 text-[14px] font-bold text-[#405A80]">관리 후 기대할 수 있는 변화</p>
            {[
              {
                label: '칫솔질로 치태를 관리하면',
                value: score.ceilingByBrushing,
                hint:
                  score.recoverableByBrushing > 0
                    ? `치태 감점 중 ${score.recoverableByBrushing}점 회복 가능`
                    : '치태 감점이 없어 칫솔질로 회복할 점수는 없어요.',
                color: '#869BC9',
              },
              {
                label: '스케일링으로 치석을 제거하면',
                value: score.ceilingAfterScaling,
                hint: '치석을 제거했을 때의 예상 점수예요.',
                color: '#C394A7',
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="m-0 text-[13px] font-semibold text-[#4E607B]">{item.label}</p>
                <p className="mb-0 mt-1.5 flex items-baseline gap-1.5 text-[14px] font-semibold tabular-nums text-[#4E607B]">
                  {score.total}
                  <span className="text-[#8FA5C3]">→</span>
                  <strong className="text-[28px] font-bold leading-none tracking-[-0.5px] text-[#4C7EC8]">
                    {item.value}
                  </strong>
                </p>
                <div
                  className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[#E2E8F2]"
                  aria-hidden
                >
                  <span style={{ width: `${score.total}%`, backgroundColor: '#BAC8DF' }} />
                  <span
                    style={{
                      width: `${Math.max(0, item.value - score.total)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <p className="mb-0 mt-1.5 text-[13px] leading-relaxed text-[#4E607B]">
                  {item.hint}
                </p>
              </div>
            ))}
          </div>
          <p className="mb-0 mt-2 px-1 text-[12px] leading-relaxed text-[#62718A]">
            이번 촬영 구역의 감점을 기준으로 한 예상이며, 다음 측정 결과와 다를 수 있어요.
          </p>
        </section>
      )}
      {section !== 'score' && !!report.actions?.length && (
        <section className={`${CARD} overflow-hidden`}>
          <div className="relative -mx-5 -mt-5 mb-5 h-[160px] overflow-hidden bg-[#E8F2FD]">
            <Image
              src="/images/dashboard/report-care-banner.webp"
              alt="스캐너와 칫솔, 치실이 놓인 구강 관리 공간"
              fill
              sizes="(max-width: 640px) 90vw, 600px"
              className="object-cover object-right"
            />
            <p className="absolute left-4 top-5 m-0 max-w-[45%] text-[15px] font-bold leading-relaxed text-[#42618A]">
              오늘의 관리가
              <br />
              다음 변화를 만들어요
            </p>
          </div>
          <h2 className="mb-1 mt-0 text-[18px] font-bold tracking-[-0.4px] text-content">
            지금 할 일
          </h2>
          <ol className="mb-0 mt-1 list-none divide-y divide-hairline p-0">
            {report.actions.slice(0, 3).map((action, i) => {
              const href = actionHref(action.code);
              const buttonLabel =
                action.code === 'SCALING'
                  ? '근처 치과 찾기'
                  : action.code === 'RECAPTURE'
                    ? '다음 스캔하기'
                    : '관리 용품 추천';
              const buttonHref =
                href === '/products' ? `/products?session=${report.sessionId}` : href;
              const title = (
                <span className="relative isolate inline px-0.5">
                  <svg
                    viewBox="0 0 180 24"
                    preserveAspectRatio="none"
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[18px] w-full"
                  >
                    <path
                      d={i % 2 === 0 ? 'M5 15 Q65 10 175 13' : 'M5 12 Q100 17 175 11'}
                      fill="none"
                      stroke={MARKER[i]}
                      strokeWidth={10}
                      strokeLinecap="round"
                      opacity={0.7}
                    />
                  </svg>
                  {action.title}
                </span>
              );
              return (
                <li key={`${action.code}-${i}`} className="flex gap-3.5 py-5 last:pb-1">
                  <span
                    aria-label={`${i + 1}순위`}
                    className={`pt-0.5 text-[20px] font-bold leading-none tabular-nums tracking-[-0.8px] ${i === 0 ? 'text-[#647A9A]' : 'text-[#A3B1C4]'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="m-0 text-[15px] font-bold leading-relaxed text-content">
                        {title}
                      </h3>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold ${action.code === 'SCALING' ? 'bg-[#F4E5EB] text-[#96647B]' : action.code === 'RECAPTURE' ? 'bg-[#E3ECFA] text-[#5275A7]' : 'bg-[#E3F0EA] text-[#547E70]'}`}
                      >
                        {action.tag || '관리 안내'}
                      </span>
                    </div>
                    <p className="mb-0 mt-2 break-keep text-[15px] font-medium leading-[1.75] text-[#4E607B]">
                      {action.detail}
                    </p>
                    <Link
                      href={buttonHref}
                      className={`mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-85 ${action.code === 'SCALING' ? 'bg-[#F4E5EB] text-[#87536B]' : action.code === 'RECAPTURE' ? 'bg-[#E3ECFA] text-[#406392]' : 'bg-[#E3F0EA] text-[#426B5D]'}`}
                    >
                      {buttonLabel}
                      <ArrowUpRight size={14} aria-hidden />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {section !== 'score' && report.notice && (
        <p className="mt-4 px-1 text-[13px] font-medium leading-relaxed text-[#4E607B]">
          {report.notice}
        </p>
      )}
    </>
  );
}
