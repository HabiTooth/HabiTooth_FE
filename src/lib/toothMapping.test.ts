import { describe, expect, it } from 'vitest';
import { remapFdi, remapTeeth } from './toothMapping';

describe('remapFdi', () => {
  it('결번이 없으면 번호를 그대로 둔다', () => {
    for (const tooth of [11, 18, 23, 37, 48]) {
      expect(remapFdi(tooth, [])).toBe(tooth);
    }
  });

  it('교정 발치(14) 뒤쪽 번호를 한 칸씩 되돌린다', () => {
    const missing = [14];
    expect(remapFdi(11, missing)).toBe(11);
    expect(remapFdi(13, missing)).toBe(13);
    expect(remapFdi(14, missing)).toBe(15);
    expect(remapFdi(15, missing)).toBe(16);
    expect(remapFdi(17, missing)).toBe(18);
  });

  it('다른 사분면은 건드리지 않는다', () => {
    const missing = [14];
    expect(remapFdi(24, missing)).toBe(24);
    expect(remapFdi(34, missing)).toBe(34);
    expect(remapFdi(44, missing)).toBe(44);
  });

  it('사분면마다 결번을 따로 센다', () => {
    const missing = [14, 24, 34, 44];
    expect(remapFdi(14, missing)).toBe(15);
    expect(remapFdi(24, missing)).toBe(25);
    expect(remapFdi(34, missing)).toBe(35);
    expect(remapFdi(44, missing)).toBe(45);
  });

  it('한 사분면에 결번이 둘이면 두 칸 밀린다', () => {
    const missing = [14, 15];
    expect(remapFdi(13, missing)).toBe(13);
    expect(remapFdi(14, missing)).toBe(16);
    expect(remapFdi(15, missing)).toBe(17);
    expect(remapFdi(16, missing)).toBe(18);
  });

  it('사랑니만 빠지면 앞쪽 번호는 그대로다', () => {
    const missing = [18, 28, 38, 48];
    expect(remapFdi(11, missing)).toBe(11);
    expect(remapFdi(17, missing)).toBe(17);
  });

  it('남은 자리를 넘어서는 번호는 버린다', () => {
    expect(remapFdi(18, [14])).toBeNull();
    expect(remapFdi(17, [14, 15])).toBeNull();
  });

  it('FDI 형식이 아니면 버린다', () => {
    for (const bad of [0, 9, 10, 19, 51, 99, -11]) {
      expect(remapFdi(bad, [])).toBeNull();
    }
  });
});

describe('remapTeeth', () => {
  const rows = [
    { toothNumber: 13, riskLevel: 'LOW' },
    { toothNumber: 14, riskLevel: 'HIGH' },
    { toothNumber: 15, riskLevel: 'MEDIUM' },
  ];

  it('결번이 없으면 원본을 그대로 돌려준다', () => {
    expect(remapTeeth(rows, [])).toBe(rows);
  });

  it('번호만 바꾸고 나머지 필드는 유지한다', () => {
    expect(remapTeeth(rows, [14])).toEqual([
      { toothNumber: 13, riskLevel: 'LOW' },
      { toothNumber: 15, riskLevel: 'HIGH' },
      { toothNumber: 16, riskLevel: 'MEDIUM' },
    ]);
  });

  it('자리를 못 찾은 항목은 뺀다', () => {
    const result = remapTeeth([{ toothNumber: 18 }], [14]);
    expect(result).toEqual([]);
  });
});
