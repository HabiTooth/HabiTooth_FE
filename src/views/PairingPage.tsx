'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Bluetooth, Headphones } from 'lucide-react';
import ListItem from '@/components/molecules/ListItem';
import SignalBars, { SIGNAL_LABEL } from '@/components/atoms/SignalBars';
import type { SignalLevel } from '@/components/atoms/SignalBars';

const MOCK_DEVICES: { id: string; name: string; signal: SignalLevel; recommended?: boolean }[] = [
  { id: '1', name: 'HabiTooth_ESP32',    signal: 'strong', recommended: true },
  { id: '2', name: 'HabiTooth_Mini_001', signal: 'medium' },
  { id: '3', name: 'HabiTooth_Pro_A1B2', signal: 'weak' },
];

const ToothThumb = () => (
  <svg width="28" height="28" viewBox="75 45 255 258" fill="none">
    <defs>
      <linearGradient id="thumbGrad" x1="75" y1="0" x2="330" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#4A86D9" />
        <stop offset="1" stopColor="#6BA4E8" />
      </linearGradient>
    </defs>
    <path d="M 194 79 C 171 59 138 58 116 76 C 95 94 91 122 100 151 C 106 171 115 194 126 219 L 147 268 C 152 281 160 286 174 283 L 174 221 C 174 202 185 190 200 190 C 215 190 226 202 226 221 L 226 283 C 240 286 248 281 253 268 L 274 219 C 285 194 294 171 300 151 C 309 122 305 94 284 76 C 267 62 245 58 225 64" stroke="url(#thumbGrad)" strokeWidth="15.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 194 79 L 194 143" stroke="url(#thumbGrad)" strokeWidth="15.5" strokeLinecap="round" />
    <circle cx="194" cy="143" r="16.5" fill="url(#thumbGrad)" />
    <circle cx="222" cy="70"  r="16.5" fill="url(#thumbGrad)" />
  </svg>
);

export default function PairingPage() {
  const router = useRouter();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => router.push('/oral-setup'), 1500);
  };

  const [recommended, ...others] = MOCK_DEVICES;

  return (
    <div className="max-w-[430px] min-h-svh mx-auto bg-background px-5 pt-[56px] pb-10 flex flex-col relative z-10">
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />

      {/* Header */}
      <div className="flex items-center mb-4 relative z-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center p-1 bg-transparent border-none cursor-pointer text-content"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 m-0 text-[18px] font-bold text-content">
          디바이스 연결
        </h2>
      </div>

      {/* Connection guide */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[16px] shadow-card px-4 py-3 mb-5 relative z-10">
        <p className="m-0 text-[12px] text-muted leading-relaxed">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 mb-0.5 align-middle" />
          기기의 전원을 켜고 블루투스 모드로 설정해주세요.
        </p>
        <p className="m-0 text-[12px] text-muted leading-relaxed mt-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 mb-0.5 align-middle" />
          LED가 파란색으로 깜빡이면 연결 준비가 완료된 상태입니다.
        </p>
      </div>

      {/* Scanning area */}
      <div className="flex flex-col items-center mb-6 relative z-10">
        <div className="relative w-[200px] h-[200px] flex items-center justify-center mb-3">
          <div className="scan-ring" style={{ animationDelay: '0s' }} />
          <div className="scan-ring" style={{ animationDelay: '0.8s' }} />
          <div className="scan-ring" style={{ animationDelay: '1.6s' }} />
          <div className="w-[110px] h-[110px] bg-white rounded-full shadow-card flex items-center justify-center relative z-10">
            <Bluetooth size={44} color="#4A86D9" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-primary font-medium text-[15px] m-0 mb-2.5">기기를 검색 중입니다...</p>
        <div className="flex gap-2">
          <div className="scan-dot" style={{ animationDelay: '0s' }} />
          <div className="scan-dot" style={{ animationDelay: '0.3s' }} />
          <div className="scan-dot" style={{ animationDelay: '0.6s' }} />
        </div>
      </div>

      {/* Recommended device — unique styling, kept inline */}
      <div className="relative z-10 mb-4">
        <p className="text-[13px] font-semibold text-content mb-2">발견된 기기</p>
        <div className="bg-white rounded-[16px] border-[1.5px] border-primary/30 shadow-card p-4 flex items-center gap-3">
          <div className="w-[46px] h-[46px] bg-[#EAF2FC] rounded-[12px] flex items-center justify-center flex-shrink-0">
            <ToothThumb />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[13px] font-semibold text-content truncate">{recommended.name}</span>
              <span className="text-[10px] font-bold text-white bg-primary rounded-[4px] px-1.5 py-[2px] flex-shrink-0">추천</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted">신호 강도: {SIGNAL_LABEL[recommended.signal]}</span>
              <SignalBars level={recommended.signal} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleConnect(recommended.id)}
            disabled={!!connectingId}
            className="px-3.5 h-9 bg-primary text-white text-[13px] font-semibold rounded-[10px] flex-shrink-0 cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {connectingId === recommended.id ? '연결 중...' : '연결하기'}
          </button>
        </div>
      </div>

      {/* Other devices — ListItem molecule */}
      <div className="relative z-10 mb-4">
        <p className="text-[13px] font-semibold text-content mb-2">다른 기기</p>
        <div className="flex flex-col gap-2">
          {others.map((device) => (
            <ListItem
              key={device.id}
              left={
                <div className="w-9 h-9 bg-hairline rounded-[10px] flex items-center justify-center">
                  <Bluetooth size={16} color="#8A94A6" />
                </div>
              }
              title={device.name}
              subtitle={
                <>
                  <span className="text-[12px] text-muted">신호 강도: {SIGNAL_LABEL[device.signal]}</span>
                  <SignalBars level={device.signal} />
                </>
              }
              right={
                <button
                  type="button"
                  onClick={() => handleConnect(device.id)}
                  disabled={!!connectingId}
                  className="px-3 h-8 border border-hairline text-content text-[12px] font-medium rounded-[8px] cursor-pointer bg-transparent disabled:opacity-60 whitespace-nowrap"
                >
                  연결
                </button>
              }
            />
          ))}
        </div>
      </div>

      {/* Manual connect — ListItem molecule */}
      <div className="relative z-10 mb-4">
        <ListItem
          left={<Bluetooth size={17} color="#4A86D9" />}
          title="수동으로 연결하기"
          right={<ChevronRight size={16} color="#8A94A6" />}
          onClick={() => {}}
        />
      </div>

      {/* Help — visually distinct */}
      <div className="relative z-10 bg-[#D6E6F8] rounded-[14px] px-4 py-3.5 flex items-center gap-3 mt-auto">
        <div className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
          <Headphones size={17} color="#4A86D9" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="m-0 text-[13px] font-semibold text-content">연결에 문제가 있으신가요?</p>
          <p className="m-0 text-[12px] text-muted mt-0.5">연결 가이드를 확인하거나 고객센터에 문의하세요.</p>
        </div>
        <button
          type="button"
          className="px-3 h-8 border border-primary/30 rounded-[8px] text-[12px] font-medium text-primary flex-shrink-0 cursor-pointer bg-white/70 whitespace-nowrap"
        >
          도움말 보기
        </button>
      </div>
    </div>
  );
}
