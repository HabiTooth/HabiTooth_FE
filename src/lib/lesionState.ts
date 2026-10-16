import type { LesionType } from '@/lib/api/common';
import type { ToothLesion } from '@/lib/api/report';

export type ToothLesionState = 'calculus' | 'plaque' | 'normal';

export interface ToothStateCounts {
  calculus: number;
  plaque: number;
  clean: number;
  unscanned: number;
}

interface LesionRow {
  lesionType: string;
  areaRatio: number;
  riskLevel?: string;
}

// 면적이 있어도 위험도가 깨끗이면 병변으로 안 본다
export const isActiveLesion = (row: { areaRatio: number; riskLevel?: string }) =>
  row.areaRatio > 0 && row.riskLevel !== 'VERY_LOW';

// 치석 폴리곤(또는 치석 비율)이 있으면 calculus, 치태만 있으면 plaque
export function lesionState(lesions: ToothLesion[], results: LesionRow[]): ToothLesionState {
  const has = (type: LesionType) =>
    lesions.some((l) => l.lesionType === type && l.polygon.length >= 3) ||
    results.some((r) => r.lesionType === type && isActiveLesion(r));
  if (has('CALCULUS')) return 'calculus';
  if (has('PLAQUE')) return 'plaque';
  return 'normal';
}

// 3D 모형 범례와 리포트 상단이 같은 숫자를 보여주도록 한 곳에서 센다
export function countToothStates(input: {
  teeth: readonly number[];
  missing: readonly number[];
  scanned: readonly number[];
  results: ReadonlyArray<LesionRow & { toothNumber: number | string }>;
  lesions: readonly ToothLesion[];
}): ToothStateCounts {
  const gone = new Set(input.missing.map(String));
  const shot = new Set(input.scanned.map(String));
  const counts: ToothStateCounts = { calculus: 0, plaque: 0, clean: 0, unscanned: 0 };
  for (const tooth of input.teeth) {
    const fdi = String(tooth);
    if (gone.has(fdi)) continue;
    const rows = input.results.filter((r) => String(r.toothNumber) === fdi);
    const polygons = input.lesions.filter((l) => String(l.toothNumber) === fdi);
    const state = lesionState(polygons, rows);
    const scanned = shot.has(fdi) || rows.length > 0 || polygons.length > 0;
    if (state === 'calculus') counts.calculus++;
    else if (state === 'plaque') counts.plaque++;
    else if (scanned) counts.clean++;
    else counts.unscanned++;
  }
  return counts;
}
