'use client';

import CareGuideCard from '@/components/molecules/CareGuideCard';
import type { CareGuideSectionProps } from './CareGuideSection.types';

export default function CareGuideSection({ items }: CareGuideSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-5 mt-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">맞춤 관리 추천</h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item, index) => (
          <CareGuideCard key={index} {...item} />
        ))}
      </div>
    </div>
  );
}