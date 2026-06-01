export interface HistoryItem {
  date: string;
  time: string;
  score: number;
  grade: string;
}

export interface HistoryListSectionProps {
  items: HistoryItem[];
}