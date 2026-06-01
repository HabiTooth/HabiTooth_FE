'use client';

import { Check } from 'lucide-react';
import type { StepIndicatorProps } from './StepIndicator.types';

export type { StepIndicatorProps } from './StepIndicator.types';

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-start justify-center">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1 w-14">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200
                  ${done || active ? 'bg-primary text-white' : 'bg-white border-2 border-hairline text-muted'}
                  ${active ? 'ring-4 ring-primary/20' : ''}`}
              >
                {done ? <Check size={13} strokeWidth={3} /> : n}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight
                ${active ? 'text-primary' : done ? 'text-primary' : 'text-muted'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-0.5 mb-4 ${n < current ? 'bg-primary' : 'bg-hairline'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
