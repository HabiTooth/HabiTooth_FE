export type GuideType = 'good' | 'warning' | 'danger';

export interface GuideItem {
  type: GuideType;
  title: string;
  description: string;
}

export interface LLMGuideSectionProps {
  items: GuideItem[];
  isLoading?: boolean;
  /** 저장된 게 없어 새로 만드는 중. 수 분 걸림 */
  generating?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}
