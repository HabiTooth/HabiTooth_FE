import type { DetectionClass } from '@/types/analysis';

export interface BadgeProps {
  type: DetectionClass;
  className?: string;
}
