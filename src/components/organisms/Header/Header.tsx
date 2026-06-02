'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import type { HeaderProps } from './Header.types';

export default function Header({ hasNotification = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
          <Image
            src="/icons/HabiTooth_icon_gap_font_fixed.svg"
            alt="HabiTooth 로고"
            width={28}
            height={28}
          />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-800">
            <span className="text-[#4A86D9]">Habi</span>Tooth
          </h1>
          <p className="text-[10px] text-gray-400">AI 구강 모니터링 디바이스</p>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 bg-white rounded-full flex items-center justify-center">
          <Bell size={18} className="text-gray-500" />
          {hasNotification && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#4A86D9] rounded-full" />
          )}
        </button>
        <Link href="/mypage" className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
          <User size={18} className="text-gray-500" />
        </Link>
      </div>
    </header>
  );
}