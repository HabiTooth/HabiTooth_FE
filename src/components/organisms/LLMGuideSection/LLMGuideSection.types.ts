import type { FocusChip } from '@/lib/toothDetail';

export type GuideType = 'good' | 'warning' | 'danger';

export interface GuideItem {
  type: GuideType;
  title: string;
  description: string;
  // 제목이 특정 치아를 짚었을 때
  tooth?: number;
}

export interface LLMGuideSectionProps {
  items: GuideItem[];
  isLoading?: boolean;
  /** 저장된 게 없어 새로 만드는 중. 수 분 걸림 */
  generating?: boolean;
  failed?: boolean;
  onRetry?: () => void;
  onToothClick?: (tooth: number) => void;
  // 위험한 순서의 신경 쓸 치아. 누르면 상단 모형에서 그 치아로
  focusTeeth?: FocusChip[];
}
