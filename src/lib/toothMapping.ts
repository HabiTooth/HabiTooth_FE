const QUADRANTS = [1, 2, 3, 4];
const POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8];

/** 사분면의 해부학적 순서 (가운데 앞니 → 안쪽 사랑니) */
export const quadrantTeeth = (quadrant: number) =>
  POSITIONS.map((position) => quadrant * 10 + position);

/**
 * FDI 세그멘테이션 모델은 발치를 모르고 사분면마다 앞에서부터 순서대로 번호를 매긴다.
 * 교정으로 14를 뺐으면 실제 15를 14로, 16을 15로 밀어서 보낸다.
 * 사용자가 등록한 결번을 건너뛰며 다시 펼쳐 실제 FDI를 되돌린다.
 *
 * 결번이 없으면 그대로 반환한다.
 */
export function remapFdi(modelNumber: number, missing: number[]): number | null {
  const quadrant = Math.floor(modelNumber / 10);
  const position = modelNumber % 10;
  if (!QUADRANTS.includes(quadrant) || position < 1 || position > 8) return null;

  const present = quadrantTeeth(quadrant).filter((tooth) => !missing.includes(tooth));
  return present[position - 1] ?? null;
}

/**
 * 자리를 넘어서는 번호는 결번 설정과 실제 촬영이 어긋난 경우다.
 * 엉뚱한 치아에 칠하느니 빼는 쪽이 낫다.
 */
export function remapTeeth<T extends { toothNumber: number }>(
  rows: T[],
  missing: number[],
): T[] {
  if (missing.length === 0) return rows;

  return rows.flatMap((row) => {
    const toothNumber = remapFdi(row.toothNumber, missing);
    return toothNumber === null ? [] : [{ ...row, toothNumber }];
  });
}
