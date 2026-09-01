'use client';

import { LOWER_ROW, UPPER_ROW } from '@/lib/dentition';

const RX = 43;
const RY = 39;
const GAP_DEG = 14;
const SIZE = 12.5;

/** 오른쪽 치아가 화면 왼쪽에 오도록 (거울 기준) */
function place(index: number, total: number, upper: boolean) {
  const t = index / (total - 1);
  const sweep = 180 - GAP_DEG * 2;
  const deg = upper ? 180 + GAP_DEG + t * sweep : 180 - GAP_DEG - t * sweep;
  const rad = (deg * Math.PI) / 180;

  return {
    left: `${50 + RX * Math.cos(rad)}%`,
    top: `${50 + RY * Math.sin(rad)}%`,
  };
}

export default function ToothArch({
  missing,
  onToggle,
  selected,
}: {
  missing: number[];
  onToggle: (tooth: number) => void;
  selected: number | null;
}) {
  const teeth = [
    ...UPPER_ROW.map((tooth, i) => ({ tooth, ...place(i, UPPER_ROW.length, true) })),
    ...LOWER_ROW.map((tooth, i) => ({ tooth, ...place(i, LOWER_ROW.length, false) })),
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-square">
      <span className="absolute left-1/2 top-3 -translate-x-1/2 text-[10px] font-semibold text-muted">
        위쪽
      </span>
      <span className="absolute left-1/2 bottom-3 -translate-x-1/2 text-[10px] font-semibold text-muted">
        아래쪽
      </span>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted">
        오른쪽
      </span>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted">
        왼쪽
      </span>

      {teeth.map(({ tooth, left, top }) => {
        const gone = missing.includes(tooth);
        const active = selected === tooth;
        return (
          <button
            key={tooth}
            type="button"
            onClick={() => onToggle(tooth)}
            aria-pressed={gone}
            style={{ left, top, width: `${SIZE}%`, height: `${SIZE}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums transition-all ${
              gone
                ? 'bg-hairline text-muted/50 line-through'
                : 'bg-primary-light text-primary'
            } ${active ? 'ring-2 ring-primary z-10 scale-110' : ''}`}
          >
            {tooth}
          </button>
        );
      })}
    </div>
  );
}
