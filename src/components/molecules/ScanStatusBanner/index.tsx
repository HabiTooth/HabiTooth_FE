'use client';

import { CheckCircle2, AlertCircle, XCircle, AlertTriangle, Sun } from 'lucide-react';
import type { ScanStatusBannerProps, ScanStatusType } from './ScanStatusBanner.types';

export type { ScanStatusBannerProps, ScanStatusType } from './ScanStatusBanner.types';

type Config = {
  bg: string;
  border: string;
  textColor: string;
  Icon: React.ElementType;
  label: string;
  sub: string;
};

const CONFIG: Record<ScanStatusType, Config> = {
  good:     { bg: 'bg-success/10',  border: 'border-success/40',  textColor: 'text-success',  Icon: CheckCircle2,   label: '잘 찍히고 있어요',       sub: '적절한 거리와 조명, 안정적인 상태입니다.' },
  far:      { bg: 'bg-warning/10',  border: 'border-warning/40',  textColor: 'text-warning',  Icon: AlertCircle,    label: '너무 멀어요',             sub: '카메라를 치아에 더 가까이 대주세요.' },
  close:    { bg: 'bg-danger/10',   border: 'border-danger/40',   textColor: 'text-danger',   Icon: XCircle,        label: '너무 가까워요',           sub: '카메라를 조금 멀리 대주세요.' },
  shaking:  { bg: 'bg-danger/10',   border: 'border-danger/40',   textColor: 'text-danger',   Icon: AlertTriangle,  label: '흔들림이 감지됐어요',     sub: '카메라를 안정적으로 유지해 주세요.' },
  dark:     { bg: 'bg-warning/10',  border: 'border-warning/40',  textColor: 'text-warning',  Icon: Sun,            label: '조명이 부족해요',         sub: '조명을 밝게 해주세요.' },
  complete: { bg: 'bg-success/10',  border: 'border-success/40',  textColor: 'text-success',  Icon: CheckCircle2,   label: '스캔 범위가 충분해요!',   sub: '천천히 마무리해 주세요.' },
};

export default function ScanStatusBanner({ status }: ScanStatusBannerProps) {
  const { bg, border, textColor, Icon, label, sub } = CONFIG[status];
  return (
    <div key={status} className={`animate-fade-banner flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl border ${bg} ${border}`}>
      <div className="flex items-center gap-1.5">
        <Icon size={15} className={textColor} />
        <span className={`text-[13px] font-semibold ${textColor}`}>{label}</span>
      </div>
      <span className="text-[11px] text-muted">{sub}</span>
    </div>
  );
}
