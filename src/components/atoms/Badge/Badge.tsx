'use client';

import type { BadgeProps } from './Badge.types';

export default function Badge({ type, className }: BadgeProps) {
  return (
    <div data-type={type} className={className}>
      {type}
    </div>
  );
}
