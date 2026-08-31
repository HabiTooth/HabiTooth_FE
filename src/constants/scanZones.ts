import type { ViewType } from '@/lib/api/scan';

export type ZoneGroup = 'UPPER' | 'LOWER' | 'OUTER';

export interface ScanZone {
  viewType: ViewType;
  label: string;
  fullLabel: string;
  group: ZoneGroup;
  teeth: number[];
}

// 좌/우는 촬영자 기준 — UPPER_RIGHT_* = 촬영자의 오른쪽. 도식은 거울처럼 반전돼 화면 오른쪽에 그려짐
export const SCAN_ZONES: ScanZone[] = [
  { viewType: 'UPPER_RIGHT_MOLAR',    label: '우측 어금니',     fullLabel: '상악 우측 어금니',     group: 'UPPER', teeth: [18, 17, 16] },
  { viewType: 'UPPER_RIGHT_PREMOLAR', label: '우측 작은어금니', fullLabel: '상악 우측 작은어금니', group: 'UPPER', teeth: [15, 14, 13] },
  { viewType: 'UPPER_FRONT',          label: '앞니',            fullLabel: '상악 앞니',            group: 'UPPER', teeth: [12, 11, 21, 22] },
  { viewType: 'UPPER_LEFT_PREMOLAR',  label: '좌측 작은어금니', fullLabel: '상악 좌측 작은어금니', group: 'UPPER', teeth: [23, 24, 25] },
  { viewType: 'UPPER_LEFT_MOLAR',     label: '좌측 어금니',     fullLabel: '상악 좌측 어금니',     group: 'UPPER', teeth: [26, 27, 28] },

  { viewType: 'LOWER_RIGHT_MOLAR',    label: '우측 어금니',     fullLabel: '하악 우측 어금니',     group: 'LOWER', teeth: [48, 47, 46] },
  { viewType: 'LOWER_RIGHT_PREMOLAR', label: '우측 작은어금니', fullLabel: '하악 우측 작은어금니', group: 'LOWER', teeth: [45, 44, 43] },
  { viewType: 'LOWER_FRONT',          label: '앞니',            fullLabel: '하악 앞니',            group: 'LOWER', teeth: [42, 41, 31, 32] },
  { viewType: 'LOWER_LEFT_PREMOLAR',  label: '좌측 작은어금니', fullLabel: '하악 좌측 작은어금니', group: 'LOWER', teeth: [33, 34, 35] },
  { viewType: 'LOWER_LEFT_MOLAR',     label: '좌측 어금니',     fullLabel: '하악 좌측 어금니',     group: 'LOWER', teeth: [36, 37, 38] },

  { viewType: 'OUTER_RIGHT',  label: '우측 협면', fullLabel: '우측 협면', group: 'OUTER', teeth: [18, 17, 16, 15, 14, 48, 47, 46, 45, 44] },
  { viewType: 'OUTER_CENTER', label: '전치 순면', fullLabel: '전치 순면', group: 'OUTER', teeth: [13, 12, 11, 21, 22, 23, 43, 42, 41, 31, 32, 33] },
  { viewType: 'OUTER_LEFT',   label: '좌측 협면', fullLabel: '좌측 협면', group: 'OUTER', teeth: [24, 25, 26, 27, 28, 34, 35, 36, 37, 38] },
];

export const zonesOfGroup = (group: ZoneGroup) =>
  SCAN_ZONES.filter((z) => z.group === group);

export const GROUP_LABELS: Record<ZoneGroup, string> = {
  UPPER: '상악 안쪽',
  LOWER: '하악 안쪽',
  OUTER: '바깥쪽',
};

export const TOOTH_TO_LINGUAL_ZONE = new Map<number, ViewType>(
  SCAN_ZONES.filter((z) => z.group !== 'OUTER').flatMap((z) =>
    z.teeth.map((t) => [t, z.viewType] as const),
  ),
);

export const TOOTH_TO_BUCCAL_ZONE = new Map<number, ViewType>(
  SCAN_ZONES.filter((z) => z.group === 'OUTER').flatMap((z) =>
    z.teeth.map((t) => [t, z.viewType] as const),
  ),
);

export const toothToZone = (tooth: number, surface: 'LINGUAL' | 'BUCCAL') =>
  (surface === 'LINGUAL' ? TOOTH_TO_LINGUAL_ZONE : TOOTH_TO_BUCCAL_ZONE).get(tooth) ?? null;

export const ALL_VIEW_TYPES: ViewType[] = SCAN_ZONES.map((z) => z.viewType);

export const ZONE_GROUP_ORDER: ZoneGroup[] = ['UPPER', 'LOWER', 'OUTER'];

export const estimateMinutes = (zoneCount: number) => Math.max(1, Math.ceil((zoneCount * 20) / 60));
