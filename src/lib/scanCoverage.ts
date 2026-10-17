import { SCAN_ZONES } from '@/constants/scanZones';
import type { ViewType } from '@/lib/api/scan';

// 촬영 구역이 커버하는 치아. 목록에 있고 결과 없으면 깨끗, 목록에 없으면 미촬영
export function teethInZones(zones: ViewType[]): number[] {
  const covered = new Set<number>();
  for (const zone of zones) {
    const found = SCAN_ZONES.find((z) => z.viewType === zone);
    found?.teeth.forEach((tooth) => covered.add(tooth));
  }
  return [...covered].sort((a, b) => a - b);
}
