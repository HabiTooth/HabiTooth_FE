import { describe, expect, it } from 'vitest';
import { discoverSessions, pairWithDates } from './sessionIndex';

describe('세션 id 탐색', () => {
  it('내 것만 골라 최신 순으로 준다', async () => {
    const mine = new Set([55, 52, 48]);
    const ids = await discoverSessions(57, async (id) => mine.has(id), 3);
    expect(ids).toEqual([55, 52, 48]);
  });

  it('필요한 만큼만 찾으면 멈춘다', async () => {
    const ids = await discoverSessions(57, async () => true, 2);
    expect(ids).toHaveLength(2);
  });

  it('0 이하 id는 안 본다', async () => {
    const seen: number[] = [];
    await discoverSessions(3, async (id) => { seen.push(id); return false; }, 5);
    expect(seen.every((id) => id > 0)).toBe(true);
  });

  it('내 게 없으면 빈 배열', async () => {
    expect(await discoverSessions(57, async () => false, 3)).toEqual([]);
  });
});

describe('날짜 붙이기', () => {
  it('개수가 맞으면 오래된 id에 오래된 날짜', () => {
    const refs = pairWithDates([57, 55, 52], ['2026-08-30', '2026-08-20', '2026-08-10']);
    expect(refs).toEqual([
      { sessionId: 57, scannedAt: '2026-08-30', score: null },
      { sessionId: 55, scannedAt: '2026-08-20', score: null },
      { sessionId: 52, scannedAt: '2026-08-10', score: null },
    ]);
  });

  it('개수가 안 맞으면 틀린 날짜를 붙이느니 비운다', () => {
    const refs = pairWithDates([57, 55], ['2026-08-30', '2026-08-20', '2026-08-10']);
    expect(refs.every((r) => r.scannedAt === '')).toBe(true);
  });

  it('입력 순서와 상관없이 결과가 같다', () => {
    const a = pairWithDates([52, 57, 55], ['2026-08-10', '2026-08-30', '2026-08-20']);
    const b = pairWithDates([57, 55, 52], ['2026-08-30', '2026-08-20', '2026-08-10']);
    expect(a).toEqual(b);
  });
});
