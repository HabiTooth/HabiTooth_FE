'use client';

import type { ScanBannerProps } from './ScanBanner.types';

export default function ScanBanner({ title, description, onClick }: ScanBannerProps) {
  return (
    <div className="bg-gradient-to-br from-[#4A86D9] to-[#7EB8F7] rounded-2xl p-5 mt-4 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-[10px] text-white/80 whitespace-pre-line">{description}</p>
      </div>
      <button
        onClick={onClick}
        className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0"
      >
        <span className="text-[#4A86D9] text-lg">→</span>
      </button>
    </div>
  );
}