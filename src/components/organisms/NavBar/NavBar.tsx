'use client';

import { Home, ScanLine, BookOpen, User } from 'lucide-react';
import Link from 'next/link';
import type { NavBarProps } from './NavBar.types';

export default function NavBar({ activeTab = 'home' }: NavBarProps) {
  const tabs = [
    { id: 'home', label: '홈', icon: Home, href: '/dashboard' },
    { id: 'scan', label: '스캔', icon: ScanLine, href: '/scan' },
    { id: 'history', label: '기록', icon: BookOpen, href: '/mypage/history' },
    { id: 'mypage', label: '마이페이지', icon: User, href: '/mypage' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex items-stretch h-16 z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium whitespace-nowrap ${
              isActive ? 'text-[#4A86D9]' : 'text-gray-400'
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}