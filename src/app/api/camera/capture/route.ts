import { NextRequest, NextResponse } from 'next/server';

// ESP32 /capture 엔드포인트를 서버에서 프록시 — CORS 우회용
export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get('ip');
  if (!ip) return NextResponse.json({ error: 'ip required' }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`http://${ip}/capture`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`ESP32 responded ${res.status}`);
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  } catch (e) {
    const isTimeout = e instanceof Error && e.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'capture timeout' : 'capture failed' },
      { status: 502 },
    );
  }
}
