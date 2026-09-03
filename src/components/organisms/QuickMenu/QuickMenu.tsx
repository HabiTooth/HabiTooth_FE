'use client';

import Link from 'next/link';
import { BookOpen, GitCompareArrows, MapPin, ShoppingBag, Smile, Sparkles } from 'lucide-react';

const MENU = [
  { href: '/mypage/teeth', label: '치아 정보', Icon: Smile },
  { href: '/habits', label: '구강 습관', Icon: Sparkles },
  { href: '/compare', label: '스캔 비교', Icon: GitCompareArrows },
  { href: '/clinics', label: '근처 치과', Icon: MapPin },
  { href: '/products', label: '관리 용품', Icon: ShoppingBag },
  { href: '/articles', label: '건강 정보', Icon: BookOpen },
];

export default function QuickMenu() {
  return (
    <div className="grid grid-cols-3 gap-2.5 mt-4">
      {MENU.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="bg-white/90 backdrop-blur-sm rounded-[18px] shadow-card py-4 flex flex-col items-center gap-1.5 no-underline transition-transform active:scale-[0.97]"
        >
          <span className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center">
            <Icon size={18} className="text-primary" />
          </span>
          <span className="text-[11px] font-medium text-content">{label}</span>
        </Link>
      ))}
    </div>
  );
}
