export interface ScoreRingProps {
  score: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  // 가운데 글자. 없으면 score
  label?: string;
  unit?: string;
}
