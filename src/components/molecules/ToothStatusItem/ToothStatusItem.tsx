'use client';

import ScoreRing from '@/components/atoms/ScoreRing';
import type { RiskLevel } from '@/lib/api/common';
import type { ToothStatusItemProps } from './ToothStatusItem.types';

const RISK_TEXT: Record<RiskLevel, string> = {
  VERY_LOW: '매우 낮음',
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  CRITICAL: '매우 높음',
};

// 링 색. 낮음 초록, 보통 노랑, 높음 빨강
const RING_COLOR: Record<RiskLevel, string> = {
  VERY_LOW: '#4FBF8F',
  LOW: '#4FBF8F',
  MEDIUM: '#E5B23F',
  HIGH: '#E07272',
  CRITICAL: '#E07272',
};

const UNMEASURED = '#B7C3D3';

export default function ToothStatusItem({ label, value }: ToothStatusItemProps) {
  const color = value ? RING_COLOR[value.riskLevel] : UNMEASURED;
  const counted =
    value && typeof value.affectedTeeth === 'number' && typeof value.detectedTeeth === 'number';

  return (
    <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ backgroundColor: `${color}1A` }}>
      <div className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden">
        <span className="text-[12px] font-semibold text-content">{label}</span>
        <span className="text-[14px] font-bold truncate" style={{ color }}>
          {value ? RISK_TEXT[value.riskLevel] : '미측정'}
        </span>
      </div>
      <div className="flex justify-center">
        <ScoreRing
          score={value?.score ?? 0}
          label={value && value.score !== null ? String(value.score) : '—'}
          unit={value && value.score !== null ? '점' : ''}
          color={color}
          size={80}
          strokeWidth={8}
        />
      </div>
      <p className="m-0 text-center text-[11px] font-medium text-[#687B94] tabular-nums">
        {counted
          ? `검출 치아 ${value.affectedTeeth}/${value.detectedTeeth}개`
          : value
            ? ' '
            : '이번 스캔에서 찍지 않았어요'}
      </p>
    </div>
  );
}
