'use client';

import type { QuickMenuItemProps } from './QuickMenuItem.types';

export default function QuickMenuItem({ label, icon, onClick }: QuickMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2"
    >
      <div className="w-10 h-10 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[11px] text-gray-600 font-medium">{label}</span>
    </button>
  );
}