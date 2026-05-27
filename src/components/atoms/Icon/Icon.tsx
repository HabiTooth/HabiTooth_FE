'use client';

import type { IconProps } from './Icon.types';

export default function Icon({ name, size = 24, className }: IconProps) {
  return (
    <div data-name={name} data-size={size} className={className} />
  );
}
