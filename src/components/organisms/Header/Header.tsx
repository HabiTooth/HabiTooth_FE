'use client';

import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import type { HeaderProps } from './Header.types';

const OUTLINE_D = 'M 194 79 C 171 59 138 58 116 76 C 95 94 91 122 100 151 C 106 171 115 194 126 219 L 147 268 C 152 281 160 286 174 283 L 174 221 C 174 202 185 190 200 190 C 215 190 226 202 226 221 L 226 283 C 240 286 248 281 253 268 L 274 219 C 285 194 294 171 300 151 C 309 122 305 94 284 76 C 267 62 245 58 225 64';
const STEM_D = 'M 194 79 L 194 143';

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="75 45 255 258" fill="none">
    <defs>
      <linearGradient id="headerLogoGrad" x1="75" y1="0" x2="330" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#4A86D9" />
        <stop offset="0.4" stopColor="#93C5FD" />
        <stop offset="0.5" stopColor="#BFDBFE" />
        <stop offset="0.6" stopColor="#93C5FD" />
        <stop offset="1" stopColor="#4A86D9" />
      </linearGradient>
    </defs>
    <path d={OUTLINE_D} stroke="url(#headerLogoGrad)" strokeWidth="15.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d={STEM_D} stroke="url(#headerLogoGrad)" strokeWidth="15.5" strokeLinecap="round" />
    <circle cx={194} cy={143} r={16.5} fill="url(#headerLogoGrad)" />
    <circle cx={222} cy={70} r={16.5} fill="url(#headerLogoGrad)" />
  </svg>
);

export default function Header({ hasNotification = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center shadow-card border border-hairline">
          <LogoIcon />
        </div>
        <div>
          <h1 className="text-base font-bold text-content">
            <span className="text-primary">Habi</span>Tooth
          </h1>
          <p className="text-[10px] text-muted">AI 구강 모니터링 디바이스</p>
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