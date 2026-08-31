export interface HistoryItem {
  id: string;
  date: string;
  time: string;
  score: number;
  grade: string;
}
export interface HistoryListSectionProps {
  items: HistoryItem[];
}