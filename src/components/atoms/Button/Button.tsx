'use client';

import type { ButtonProps } from './Button.types';

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  onClick,
  disabled,
  type = 'button',
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      data-variant={variant}
      data-size={size}
      data-loading={isLoading}
      className={className}
    >
      {children}
    </button>
  );
}
