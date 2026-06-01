'use client';

import Button from '@/components/atoms/Button';
import type { CareGuideCardProps } from './CareGuideCard.types';

export default function CareGuideCard({ icon, title, description, buttonLabel, onButtonClick }: CareGuideCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col items-center text-center gap-3">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onButtonClick}
        className="!text-xs !h-8 !px-4 !rounded-xl !w-full"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}