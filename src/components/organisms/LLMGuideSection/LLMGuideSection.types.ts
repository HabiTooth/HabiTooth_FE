export type GuideType = 'warning' | 'danger' | 'good';

export interface GuideItem {
  type: GuideType;
  title: string;
  description: string;
}

export interface LLMGuideSectionProps {
  items: GuideItem[];
  isLoading?: boolean;
}