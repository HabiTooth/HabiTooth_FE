export interface SessionRef {
  sessionId: number;
  scannedAt: string;
  score: number | null;
}

// BE가 기록에 sessionId를 안 줘서 쓰는 임시 저장소. 필드 생기면 이 파일 통째로 삭제
const KEY = 'habitooth.sessions';
const MAX = 30;

export function readSessions(): SessionRef[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SessionRef[]) : [];
    return sortNewestFirst(list);
  } catch {
    return [];
  }
}

const sortNewestFirst = (list: SessionRef[]) =>
  [...list].sort((a, b) => b.sessionId - a.sessionId);

function save(list: SessionRef[]): SessionRef[] {
  const next = sortNewestFirst(list).slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
  }
  return next;
}

export function rememberSession(ref: SessionRef): SessionRef[] {
  return save([ref, ...readSessions().filter((s) => s.sessionId !== ref.sessionId)]);
}

export function rememberMany(refs: SessionRef[]): SessionRef[] {
  const known = new Map(readSessions().map((s) => [s.sessionId, s]));
  for (const ref of refs) known.set(ref.sessionId, { ...known.get(ref.sessionId), ...ref });
  return save([...known.values()]);
}

export function withSession(list: SessionRef[], ref: SessionRef | null): SessionRef[] {
  if (ref === null || list.some((s) => s.sessionId === ref.sessionId)) return list;
  return sortNewestFirst([...list, ref]);
}

const PROBE_DEPTH = 40;
const PROBE_BATCH = 8;

export async function discoverSessions(
  latestId: number,
  owns: (sessionId: number) => Promise<boolean>,
  need: number,
): Promise<number[]> {
  const found: number[] = [];

  for (let offset = 1; offset <= PROBE_DEPTH && found.length < need; offset += PROBE_BATCH) {
    const batch: number[] = [];
    for (let i = 0; i < PROBE_BATCH; i++) {
      const id = latestId - offset - i;
      if (id > 0) batch.push(id);
    }
    if (batch.length === 0) break;

    const results = await Promise.all(
      batch.map(async (id) => ((await owns(id)) ? id : null)),
    );
    found.push(...results.filter((id): id is number => id !== null));
  }

  return found.slice(0, need).sort((a, b) => b - a);
}

export function pairWithDates(sessionIds: number[], dates: string[]): SessionRef[] {
  const idsOldestFirst = [...sessionIds].sort((a, b) => a - b);
  const datesOldestFirst = [...dates].sort();
  const aligned = idsOldestFirst.length === datesOldestFirst.length;

  return idsOldestFirst
    .map((sessionId, i) => ({
      sessionId,
      scannedAt: aligned ? datesOldestFirst[i] : '',
      score: null,
    }))
    .sort((a, b) => b.sessionId - a.sessionId);
}
