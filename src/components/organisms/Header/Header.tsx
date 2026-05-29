'use client';

import Image from 'next/image';
import { Bell, User } from 'lucide-react';
import type { HeaderProps } from './Header.types';

export default function Header({ hasNotification = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Image
          src="/HabiTooth_logo.png"
          alt="HabiTooth 로고"
          width={40}
          height={40}
          className="rounded-xl"
        />
        <div>
          <h1 className="text-base font-bold text-gray-800">
            <span className="text-[#4A86D9]">Habi</span>Tooth
          </h1>
          <p className="text-[10px] text-gray-400">AI 구강 모니터링 디바이스</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 bg-white rounded-full flex items-center justify-center">
          <Bell size={18} className="text-gray-500" />
          {hasNotification && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#4A86D9] rounded-full" />
          )}
        </button>
        <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
          <User size={18} className="text-gray-500" />
        </button>
      </div>
    </header>
  );
}