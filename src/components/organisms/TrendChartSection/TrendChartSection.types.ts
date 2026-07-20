export interface TrendDataPoint {
  date: string;
  score: number;
}

export interface TrendChartSectionProps {
  data: TrendDataPoint[];
}