'use client';

import type { SpinnerProps } from './Spinner.types';

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div data-size={size} className={className} />
  );
}
