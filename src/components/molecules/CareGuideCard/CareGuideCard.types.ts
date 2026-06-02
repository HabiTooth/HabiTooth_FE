import type { ReactNode } from 'react';

export interface CareGuideCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick?: () => void;
}