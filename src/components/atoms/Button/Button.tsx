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
  const base = 'rounded-full font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#4A86D9] text-white',
    ghost: 'bg-white text-[#4A86D9] border border-[#4A86D9]',
    danger: 'bg-[#EE8A86] text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
    >
      {isLoading ? '로딩 중...' : children}
    </button>
  );
}