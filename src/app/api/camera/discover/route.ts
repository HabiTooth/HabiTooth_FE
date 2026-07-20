import { NextResponse } from 'next/server';
import os from 'os';

// 같은 서브넷을 스캔해서 ESP32 카메라(/status 응답하는 기기)를 찾는다
// Next 서버가 ESP32와 같은 네트워크에 있을 때만 동작 (데모/로컬 환경용)

const probe = async (ip: string): Promise<number | null> => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 700);
  const start = Date.now();
  try {
    const res = await fetch(`http://${ip}/status`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    // ESP32 CameraWebServer의 /status는 framesize, quality 등을 담은 JSON을 반환
    if (!!json && typeof json === 'object' && 'framesize' in json) return Date.now() - start;
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
};

export async function GET() {
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

  const found: { ip: string; latencyMs: number }[] = [];
  const CONCURRENCY = 50;
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (ip) => {
        const latencyMs = await probe(ip);
        return latencyMs === null ? null : { ip, latencyMs };
      }),
    );
    for (const r of results) if (r) found.push(r);
  }
  found.sort((a, b) => a.latencyMs - b.latencyMs);

  return NextResponse.json({ devices: found });
}
