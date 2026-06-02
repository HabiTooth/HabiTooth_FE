'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, ChevronLeft, ChevronRight, Bell, Shield, FileText,
  Smartphone, Clock, LogOut, UserX, Lock,
} from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? 'bg-[#4B7BF5]' : 'bg-hairline'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );
}


function MenuItem({
  icon, label, right, onClick,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${onClick ? 'cursor-pointer active:bg-black/[0.03]' : ''}`}
    >
      <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-[13px]">{label}</div>
      {right === undefined ? <ChevronRight size={16} className="text-muted flex-shrink-0" /> : right}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="m-0 mb-2 px-1 text-[11px] font-bold text-muted uppercase tracking-widest">{title}</p>
      <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card overflow-hidden divide-y divide-hairline">
        {children}
      </div>
    </div>
  );
}


const MOCK_DEVICE = {
  serialNumber: 'HBT-2024-0042',
  firmwareVersion: 'v1.2.3',
  lastConnected: '2026-05-28 14:32',
  connected: true,
};

const MOCK_HISTORY = [
  { id: '1', date: '2026-05-28', score: 82, plaque: '낮음', tartar: '보통' },
  { id: '2', date: '2026-05-14', score: 74, plaque: '보통', tartar: '보통' },
  { id: '3', date: '2026-04-30', score: 68, plaque: '높음', tartar: '높음' },
];

function scoreColor(score: number) {
  if (score >= 80) return 'bg-success/15 text-success';
  if (score >= 70) return 'bg-warning/15 text-[#B87F00]';
  return 'bg-danger/15 text-danger';
}

export default function MyPage() {
  const router = useRouter();
  const [notifyScan, setNotifyScan] = useState(true);
  const [notifyAnalysis, setNotifyAnalysis] = useState(true);
  const [notifyDanger, setNotifyDanger] = useState(true);

  return (
    <div
      className="max-w-[430px] min-h-svh mx-auto px-5 pt-14 pb-20 flex flex-col relative"
      style={{ backgroundColor: '#EEF2FF' }}
    >
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />

      <div className="flex items-center mb-6 relative z-10">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/60 transition-colors bg-transparent border-none cursor-pointer"
        >
          <ChevronLeft size={22} className="text-content" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 m-0 text-[18px] font-bold text-content">마이페이지</h1>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mb-6 relative z-10 flex items-center gap-4">
        <div className="w-[64px] h-[64px] rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
          <User size={32} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="m-0 text-[16px] font-bold text-content">홍길동</p>
          <p className="m-0 mt-0.5 text-[14px] text-muted truncate">habitooth@example.com</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/mypage/profile')}
          className="px-3 h-8 rounded-[10px] border border-hairline text-[12px] font-semibold text-content bg-transparent cursor-pointer flex-shrink-0 hover:bg-hairline transition-colors"
        >
          프로필 편집
        </button>
      </div>

      <div className="relative z-10">
        <Section title="계정 관리">
          <MenuItem
            icon={<Lock size={15} className="text-primary" />}
            label="비밀번호 변경"
            onClick={() => router.push('/mypage/password')}
          />
          <MenuItem
            icon={<Smartphone size={15} className="text-primary" />}
            label={
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-content">디바이스 관리</span>
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${MOCK_DEVICE.connected ? 'bg-success/15 text-success' : 'bg-hairline text-muted'}`}>
                    {MOCK_DEVICE.connected ? '연결됨' : '미연결'}
                  </span>
                </div>
                <p className="m-0 mt-0.5 text-[11px] text-muted">
                  {MOCK_DEVICE.serialNumber} · {MOCK_DEVICE.firmwareVersion}
                </p>
                <p className="m-0 text-[11px] text-muted flex items-center gap-1">
                  <Clock size={10} />
                  {MOCK_DEVICE.lastConnected}
                </p>
              </div>
            }
            onClick={() => router.push('/mypage/device')}
          />
          <MenuItem
            icon={<Clock size={15} className="text-primary" />}
            label="기록 이력 관리"
            onClick={() => router.push('/mypage/history')}
          />
        </Section>

        <Section title="알림 설정">
          <MenuItem
            icon={<Bell size={15} className="text-primary" />}
            label="스캔 주기 알림"
            right={<Toggle on={notifyScan} onToggle={() => setNotifyScan(v => !v)} />}
          />
          <MenuItem
            icon={<Bell size={15} className="text-primary" />}
            label="분석 완료 알림"
            right={<Toggle on={notifyAnalysis} onToggle={() => setNotifyAnalysis(v => !v)} />}
          />
          <MenuItem
            icon={<Bell size={15} className="text-primary" />}
            label="위험 부위 경고 알림"
            right={<Toggle on={notifyDanger} onToggle={() => setNotifyDanger(v => !v)} />}
          />
        </Section>

        <Section title="기타">
          <MenuItem
            icon={<FileText size={15} className="text-primary" />}
            label="이용약관"
            onClick={() => router.push('/terms')}
          />
          <MenuItem
            icon={<Shield size={15} className="text-primary" />}
            label="개인정보 처리방침"
            onClick={() => router.push('/privacy')}
          />
          <MenuItem
            icon={<LogOut size={15} className="text-danger" />}
            label={<span className="text-danger font-semibold">로그아웃</span>}
            right={null}
            onClick={() => router.push('/login')}
          />
          <MenuItem
            icon={<UserX size={15} className="text-danger" />}
            label={<span className="text-danger font-semibold">회원탈퇴</span>}
            right={null}
            onClick={() => {}}
          />
        </Section>
        </div>
      <NavBar activeTab="mypage" />
    </div>
  );
}
