import { NextResponse } from 'next/server';
import dns from 'dns/promises';
import os from 'os';

// 같은 서브넷을 스캔해서 스캐너를 찾는다
// Next 서버가 기기와 같은 네트워크에 있을 때만 동작 (데모/로컬 환경용)

export type FirmwareKind = 'wand' | 'cam';

// wand 펌웨어는 /pending, 예전 CameraWebServer는 /status 로 자기 자신을 알림
const IDENTIFY: Array<{ kind: FirmwareKind; path: string; field: string }> = [
  { kind: 'wand', path: '/pending', field: 'seq' },
  { kind: 'cam', path: '/status', field: 'framesize' },
];

const probe = async (
  host: string,
  timeoutMs: number,
): Promise<{ kind: FirmwareKind; latencyMs: number } | null> => {
  for (const { kind, path, field } of IDENTIFY) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();
    try {
      const res = await fetch(`http://${host}${path}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      if (!!json && typeof json === 'object' && field in json) {
        return { kind, latencyMs: Date.now() - start };
      }
    } catch {
      // 다음 펌웨어 후보로
    } finally {
      clearTimeout(t);
    }
  }
  return null;
};

// mDNS(.local) 이름은 IP 스윕으로 안 잡혀서 따로 먼저 두드림. 이름 해석이 느려 타임아웃도 넉넉히
const configuredHost = (process.env.NEXT_PUBLIC_ESP32_HOST ?? '').split(':')[0].trim();
const MDNS_TIMEOUT = 4000;
const PROBE_TIMEOUT = 700;

export async function GET() {
  const found: { ip: string; latencyMs: number; kind: FirmwareKind }[] = [];

  // 이름으로 찾은 기기는 IP 스윕에서도 또 잡히므로, 미리 주소를 알아내 중복을 걷어낸다
  let namedIp: string | null = null;

  if (configuredHost) {
    const hit = await probe(configuredHost, MDNS_TIMEOUT);
    if (hit) {
      // 첫 응답에는 이름 해석 시간이 섞여 있어 실제보다 훨씬 느리게 나옴
      const warm = await probe(configuredHost, MDNS_TIMEOUT);
      found.push({ ip: configuredHost, ...(warm ?? hit) });
      namedIp = await dns
        .lookup(configuredHost, { family: 4 })
        .then((r) => r.address)
        .catch(() => null);
    }
  }

  const bases = new Set<string>();
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list ?? []) {
      if (ni.family === 'IPv4' && !ni.internal) {
        bases.add(ni.address.split('.').slice(0, 3).join('.'));
      }
    }
  }

  const candidates: string[] = [];
  for (const base of bases) {
    for (let i = 1; i <= 254; i++) candidates.push(`${base}.${i}`);
  }

  const CONCURRENCY = 50;
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (ip) => {
        if (ip === namedIp) return null;
        const hit = await probe(ip, PROBE_TIMEOUT);
        return hit === null ? null : { ip, ...hit };
      }),
    );
    for (const r of results) if (r) found.push(r);
  }

  // mDNS 이름은 해석까지 붙어 느리게 나와서, 이름으로 찾은 건 응답 속도와 상관없이 맨 앞
  const named = found.filter((d) => d.ip === configuredHost);
  const rest = found
    .filter((d) => d.ip !== configuredHost)
    .sort((a, b) => a.latencyMs - b.latencyMs);

  return NextResponse.json({ devices: [...named, ...rest] });
}
