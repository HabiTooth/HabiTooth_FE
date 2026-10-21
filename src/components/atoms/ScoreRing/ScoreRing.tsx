'use client';

import type { ScoreRingProps } from './ScoreRing.types';

export default function ScoreRing({
  score,
  color,
  size = 80,
  strokeWidth = 8,
  className,
  label,
  unit = '%',
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8ECF4"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute flex items-baseline text-[18px] font-bold tabular-nums" style={{ color }}>
        {label ?? score}
        {unit && <span className="ml-0.5 text-[11px] font-semibold">{unit}</span>}
      </span>
    </div>
  );
}