'use client';

import ScoreRing from '@/components/atoms/ScoreRing';
import { RISK_FILL, RISK_LABEL_MAP } from '@/lib/riskColors';
import type { ToothStatusItemProps } from './ToothStatusItem.types';

export default function ToothStatusItem({ label, score, riskLevel }: ToothStatusItemProps) {
  const color = RISK_FILL[riskLevel];

  return (
    <div
      className="rounded-2xl p-3 flex flex-col gap-2"
      style={{ backgroundColor: `${color}1A` }}
    >
      <div className="flex items-center gap-1 whitespace-nowrap overflow-hidden">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-medium text-gray-700 truncate">{label}</span>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{RISK_LABEL_MAP[riskLevel]}</span>
      </div>
      <div className="flex justify-center">
        <ScoreRing score={score} color={color} size={80} strokeWidth={8} />
      </div>
    </div>
  );
}