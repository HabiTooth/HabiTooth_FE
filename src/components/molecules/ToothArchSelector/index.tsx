'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { ViewType } from '@/lib/api/scan';
import { toothToZone } from '@/constants/scanZones';

export type Surface = 'LINGUAL' | 'BUCCAL';

type Arch = 'upper' | 'lower';
type ToothState = 'locked' | 'current' | 'captured' | 'selected' | 'idle';

const C = {
  gum: '#E7A3AF',
  gumMuted: '#DFE5EC',
  tooth: '#FFFFFF',
  toothLine: '#C6D3E2',
  locked: '#EDF1F6',
  lockedLine: '#DDE4EC',
  selected: '#E1EDF8',
  primary: '#4A86D9',
  success: '#4BC8A0',
};

const UPPER_W = [
  { n: 1, w: 44, r: 12 }, { n: 2, w: 35, r: 11 }, { n: 3, w: 32, r: 10 }, { n: 4, w: 28, r: 9 },
  { n: 5, w: 25, r: 9 },  { n: 6, w: 23, r: 8 },  { n: 7, w: 19, r: 7 },  { n: 8, w: 15, r: 6 },
];
const LOWER_W = [
  { n: 1, w: 33, r: 10 }, { n: 2, w: 33, r: 10 }, { n: 3, w: 34, r: 10 }, { n: 4, w: 29, r: 9 },
  { n: 5, w: 26, r: 9 },  { n: 6, w: 24, r: 8 },  { n: 7, w: 20, r: 7 },  { n: 8, w: 16, r: 6 },
];

const SHAPE: Record<string, { h: number[]; incisal: (p: number) => number; gum: (p: number) => number }> = {
  'BUCCAL:upper': {
    h: [60, 54, 50, 45, 41, 37, 33, 28],
    incisal: (p) => 208 - 28 * Math.pow(p, 1.7),
    gum: (p) => 138 + 4 * Math.pow(p, 1.7),
  },
  'BUCCAL:lower': {
    h: [46, 48, 48, 45, 42, 40, 37, 32],
    incisal: (p) => 232 - 14 * Math.pow(p, 1.7),
    gum: (p) => 288 - 28 * Math.pow(p, 1.7),
  },
  'LINGUAL:upper': {
    h: [50, 46, 43, 40, 37, 34, 31, 27],
    incisal: (p) => 188 + 26 * Math.pow(p, 1.7),
    gum: (p) => 130 + 49 * Math.pow(p, 1.7),
  },
  'LINGUAL:lower': {
    h: [44, 46, 46, 44, 41, 39, 36, 32],
    incisal: (p) => 214 + 34 * Math.pow(p, 1.7),
    gum: (p) => 266 + 22 * Math.pow(p, 1.7),
  },
};

const CX = 320;
const GAP = 3.5;
const GUM_W = 32;
const VIEWBOX = { x: 52, y: 110, w: 536, h: 200 };

function toothPath(cx: number, yGing: number, w: number, h: number, r: number, gs: number) {
  const yInc = yGing - gs * h;
  const wg = w * 0.94;
  const x0g = cx - wg / 2;
  const x1g = cx + wg / 2;
  const x0i = cx - w / 2;
  const x1i = cx + w / 2;
  const rg = Math.min(r * 0.55, wg / 2.2);
  const ri = Math.min(r, w / 2.2);
  const d = -gs;
  return [
    `M ${(x0g + rg).toFixed(1)} ${yGing.toFixed(1)}`,
    `L ${(x1g - rg).toFixed(1)} ${yGing.toFixed(1)}`,
    `Q ${x1g.toFixed(1)} ${yGing.toFixed(1)} ${x1g.toFixed(1)} ${(yGing + d * rg).toFixed(1)}`,
    `L ${x1i.toFixed(1)} ${(yInc - d * ri).toFixed(1)}`,
    `Q ${x1i.toFixed(1)} ${yInc.toFixed(1)} ${(x1i - ri).toFixed(1)} ${yInc.toFixed(1)}`,
    `L ${(x0i + ri).toFixed(1)} ${yInc.toFixed(1)}`,
    `Q ${x0i.toFixed(1)} ${yInc.toFixed(1)} ${x0i.toFixed(1)} ${(yInc - d * ri).toFixed(1)}`,
    `L ${x0g.toFixed(1)} ${(yGing + d * rg).toFixed(1)}`,
    `Q ${x0g.toFixed(1)} ${yGing.toFixed(1)} ${(x0g + rg).toFixed(1)} ${yGing.toFixed(1)}`,
    'Z',
  ].join(' ');
}

function smooth(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

interface Tooth {
  fdi: number;
  n: number;
  p: number;
  cx: number;
  yInc: number;
  yGing: number;
  w: number;
  h: number;
  gs: number;
  rot: number;
  zone: ViewType | null;
  d: string;
}

function buildArch(arch: Arch, surface: Surface): Tooth[] {
  const base = arch === 'upper' ? UPPER_W : LOWER_W;
  const shape = SHAPE[`${surface}:${arch}`];
  const gs = arch === 'upper' ? -1 : 1;
  const tilt = surface === 'BUCCAL' ? 1 : -1;
  const scale = (n: number) => (surface === 'LINGUAL' ? (n >= 4 ? 1.06 : 0.93) : 1);

  const sized = base.map((t, i) => ({ ...t, w: t.w * scale(t.n), h: shape.h[i] }));
  const total = sized.reduce((a, t) => a + t.w + GAP, 0);

  const teeth: Tooth[] = [];
  for (const dir of [-1, 1]) {
    let edge = 0;
    for (const t of sized) {
      const off = edge + t.w / 2;
      edge += t.w + GAP;
      const p = off / total;
      const cx = CX + dir * off;
      const yInc = shape.incisal(p);
      const yGing = yInc + gs * t.h;
      const quadrant = arch === 'upper' ? (dir === -1 ? 2 : 1) : dir === -1 ? 3 : 4;
      const fdi = quadrant * 10 + t.n;
      teeth.push({
        fdi,
        n: t.n,
        p,
        cx,
        yInc,
        yGing,
        w: t.w,
        h: t.h,
        gs,
        rot: dir * 8 * Math.pow(p, 1.4) * (gs === -1 ? 1 : -1) * tilt,
        zone: toothToZone(fdi, surface),
        d: toothPath(cx, yGing, t.w, t.h, t.r, gs),
      });
    }
  }
  return teeth.sort((a, b) => a.cx - b.cx);
}

const gumPath = (teeth: Tooth[], arch: Arch, surface: Surface) =>
  smooth(teeth.map((t) => ({ x: t.cx, y: SHAPE[`${surface}:${arch}`].gum(t.p) })));

function LingualDetail({ t, tone }: { t: Tooth; tone: string }) {
  const d = -t.gs;
  if (t.n <= 3) {
    return <ellipse cx={t.cx} cy={t.yGing + d * t.h * 0.38} rx={t.w * 0.2} ry={t.h * 0.11} fill={tone} />;
  }
  const count = t.n >= 6 ? 3 : 2;
  const y = t.yInc - d * 12;
  return (
    <g fill={tone}>
      {Array.from({ length: count }).map((_, i) => (
        <rect
          key={i}
          x={t.cx + (i - (count - 1) / 2) * (t.w / (count + 0.6)) - 0.9}
          y={Math.min(y, y + 7)}
          width="1.8"
          height="7"
          rx="0.9"
        />
      ))}
    </g>
  );
}

export interface ToothArchSelectorProps {
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  selected: ViewType[];
  captured: ViewType[];
  current?: ViewType | null;
  onZoneClick: (zone: ViewType) => void;
  lockUnselected?: boolean;
  className?: string;
  compact?: boolean;
}

export default function ToothArchSelector({
  surface,
  onSurfaceChange,
  selected,
  captured,
  current = null,
  onZoneClick,
  lockUnselected = false,
  className = '',
  compact = false,
}: ToothArchSelectorProps) {
  const [hover, setHover] = useState<ViewType | null>(null);

  const upper = useMemo(() => buildArch('upper', surface), [surface]);
  const lower = useMemo(() => buildArch('lower', surface), [surface]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const capturedSet = useMemo(() => new Set(captured), [captured]);

  const stateOf = (zone: ViewType | null): ToothState => {
    if (!zone) return 'locked';
    if (lockUnselected && !selectedSet.has(zone)) return 'locked';
    if (zone === current) return 'current';
    if (capturedSet.has(zone)) return 'captured';
    if (selectedSet.has(zone)) return 'selected';
    return 'idle';
  };

  const fillOf = (zone: ViewType | null) => {
    switch (stateOf(zone)) {
      case 'captured': return C.success;
      case 'current': return C.primary;
      case 'selected': return C.selected;
      case 'locked': return C.locked;
      default: return zone === hover ? C.selected : C.tooth;
    }
  };

  const lineOf = (zone: ViewType | null) => {
    switch (stateOf(zone)) {
      case 'captured': return C.success;
      case 'current':
      case 'selected': return C.primary;
      case 'locked': return C.lockedLine;
      default: return C.toothLine;
    }
  };

  const toneOf = (zone: ViewType | null) => {
    const s = stateOf(zone);
    return s === 'captured' || s === 'current' ? 'rgba(255,255,255,.5)' : 'rgba(45,49,66,.14)';
  };

  const spot = useMemo(() => {
    if (!current) return null;
    const list = [...upper, ...lower].filter((t) => t.zone === current);
    if (!list.length) return null;
    const xs = list.flatMap((t) => [t.cx - t.w / 2, t.cx + t.w / 2]);
    const ys = list.flatMap((t) => [Math.min(t.yGing, t.yInc), Math.max(t.yGing, t.yInc)]);
    const pad = 9;
    return {
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      w: Math.max(...xs) - Math.min(...xs) + pad * 2,
      h: Math.max(...ys) - Math.min(...ys) + pad * 2,
    };
  }, [current, upper, lower]);

  const renderArch = (teeth: Tooth[], arch: Arch) => (
    <g>
      <path
        d={gumPath(teeth, arch, surface)}
        fill="none"
        stroke={C.gum}
        strokeWidth={GUM_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {teeth.map((t) => {
        const locked = stateOf(t.zone) === 'locked';
        return (
          <g
            key={t.fdi}
            transform={`rotate(${t.rot.toFixed(2)} ${t.cx.toFixed(1)} ${t.yGing.toFixed(1)})`}
            onMouseEnter={() => { if (!locked) setHover(t.zone); }}
            onMouseLeave={() => setHover(null)}
            onClick={() => { if (!locked && t.zone) onZoneClick(t.zone); }}
            style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
          >
            <path
              d={t.d}
              fill={fillOf(t.zone)}
              stroke={lineOf(t.zone)}
              strokeWidth={1.2}
              style={{ transition: 'fill .22s ease, stroke .22s ease' }}
            />
            {surface === 'LINGUAL' && <LingualDetail t={t} tone={toneOf(t.zone)} />}
          </g>
        );
      })}
    </g>
  );

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-1 p-0.5 rounded-full bg-hairline/70">
        {([
          ['BUCCAL', '바깥쪽 (협측)'],
          ['LINGUAL', '안쪽 (설측)'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onSurfaceChange(value)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              surface === value ? 'bg-white text-primary shadow-sm' : 'text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
        className={`w-full ${compact ? 'max-h-[136px]' : 'max-h-[180px]'}`}
        role="group"
        aria-label="촬영 구역 선택"
      >
        {spot && (
          <rect x={spot.x} y={spot.y} width={spot.w} height={spot.h} rx="16" fill={C.primary} opacity="0.1" />
        )}
        {renderArch(upper, 'upper')}
        {renderArch(lower, 'lower')}
      </svg>

      <div className={`items-center justify-center gap-3 text-[10px] font-medium text-muted ${compact ? 'hidden' : 'flex'}`}>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-[3px] border" style={{ background: C.selected, borderColor: C.primary }} />
          선택됨
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-[3px] flex items-center justify-center" style={{ background: C.success }}>
            <Check size={7} className="text-white" strokeWidth={4} />
          </span>
          촬영 완료
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-[3px] border" style={{ background: C.locked, borderColor: C.lockedLine }} />
          {lockUnselected ? '미선택' : '해제됨'}
        </span>
      </div>
    </div>
  );
}
