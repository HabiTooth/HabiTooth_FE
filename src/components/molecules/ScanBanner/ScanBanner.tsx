'use client';

import type { ScanBannerProps } from './ScanBanner.types';

export default function ScanBanner({ title, description, onClick }: ScanBannerProps) {
  return (
    <div className="bg-gradient-to-br from-[#4A86D9] to-[#7EB8F7] rounded-2xl p-6 mt-4 flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-white/80 whitespace-pre-line">{description}</p>
      </div>
      <button
        onClick={onClick}
        className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0"
      >
        <span className="text-[#4A86D9] text-xl">→</span>
      </button>
    </div>
  );
}