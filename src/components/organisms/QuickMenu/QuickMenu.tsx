'use client';

import { FileText, Calendar, Smile, ShieldCheck } from 'lucide-react';
import QuickMenuItem from '@/components/molecules/QuickMenuItem';
import type { QuickMenuProps } from './QuickMenu.types';

export default function QuickMenu({ onReportClick, onHistoryClick, on3DClick, onGuideClick }: QuickMenuProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mt-4">
      <QuickMenuItem
        label="분석 리포트"
        icon={<FileText size={24} className="text-[#4A86D9]" />}
        onClick={onReportClick}
      />
      <QuickMenuItem
        label="기록 관리"
        icon={<Calendar size={24} className="text-[#4A86D9]" />}
        onClick={onHistoryClick}
      />
      <QuickMenuItem
        label="3D 뷰어"
        icon={<Smile size={24} className="text-[#4A86D9]" />}
        onClick={on3DClick}
      />
      <QuickMenuItem
        label="맞춤 관리 가이드"
        icon={<ShieldCheck size={24} className="text-[#4A86D9]" />}
        onClick={onGuideClick}
      />
    </div>
  );
}