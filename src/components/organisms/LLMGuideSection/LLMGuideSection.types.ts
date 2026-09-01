export type GuideType = 'good' | 'warning' | 'danger';

export interface GuideItem {
  type: GuideType;
  title: string;
  description: string;
}

export interface LLMGuideSectionProps {
  items: GuideItem[];
  isLoading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}
