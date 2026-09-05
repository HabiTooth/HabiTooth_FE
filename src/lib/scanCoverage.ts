import { SCAN_ZONES } from '@/constants/scanZones';
import type { ViewType } from '@/lib/api/scan';

/**
 * 촬영한 구역이 커버하는 치아.
 * BE는 병변이 있는 치아만 보내기 때문에, 이 목록에 있는데 결과가 없으면 "깨끗"이고
 * 목록에도 없어야 "미촬영"이다.
 */
export function teethInZones(zones: ViewType[]): number[] {
  const covered = new Set<number>();
  for (const zone of zones) {
    const found = SCAN_ZONES.find((z) => z.viewType === zone);
    found?.teeth.forEach((tooth) => covered.add(tooth));
  }
  return [...covered].sort((a, b) => a - b);
}
