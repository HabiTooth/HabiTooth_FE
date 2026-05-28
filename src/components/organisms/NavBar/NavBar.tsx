'use client';

import { Home, ScanLine, BookOpen, User } from 'lucide-react';
import type { NavBarProps } from './NavBar.types';

export default function NavBar({ activeTab = 'home' }: NavBarProps) {
  const tabs = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'scan', label: '스캔', icon: ScanLine },
    { id: 'history', label: '기록', icon: BookOpen },
    { id: 'mypage', label: '마이페이지', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`flex flex-col items-center gap-1 text-xs font-medium ${
              isActive ? 'text-[#4A86D9]' : 'text-gray-400'
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}