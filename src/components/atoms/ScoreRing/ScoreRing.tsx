'use client';

import type { ScoreRingProps } from './ScoreRing.types';

export default function ScoreRing({ score, size = 80, strokeWidth = 8, className }: ScoreRingProps) {
  return (
    <div data-score={score} data-size={size} data-stroke-width={strokeWidth} className={className}>
      {score}
    </div>
  );
}
