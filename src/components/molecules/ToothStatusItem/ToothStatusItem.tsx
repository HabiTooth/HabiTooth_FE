'use client';

import ScoreRing from '@/components/atoms/ScoreRing';
import type { ToothStatusItemProps, RiskLevel } from './ToothStatusItem.types';

const getColor = (riskLevel: RiskLevel) => {
  if (riskLevel === 'low') return '#4A86D9';
  if (riskLevel === 'normal') return '#F0B65A';
  if (riskLevel === 'high') return '#EE8A86';
  return '#DC2626';
};

const getRiskLabel = (riskLevel: RiskLevel) => {
  if (riskLevel === 'low') return '낮음';
  if (riskLevel === 'normal') return '보통';
  if (riskLevel === 'high') return '높음';
  return '매우 높음';
};

const getBgColor = (riskLevel: RiskLevel) => {
  if (riskLevel === 'low') return 'rgba(74, 134, 217, 0.1)';
  if (riskLevel === 'normal') return 'rgba(240, 182, 90, 0.1)';
  if (riskLevel === 'high') return 'rgba(238, 138, 134, 0.1)';
  return 'rgba(220, 38, 38, 0.1)';
};

export default function ToothStatusItem({ label, score, riskLevel }: ToothStatusItemProps) {
  const color = getColor(riskLevel);

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ backgroundColor: getBgColor(riskLevel) }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{getRiskLabel(riskLevel)}</span>
      </div>
      <div className="flex justify-center">
        <ScoreRing score={score} color={color} size={100} strokeWidth={10} />
      </div>
    </div>
  );
}