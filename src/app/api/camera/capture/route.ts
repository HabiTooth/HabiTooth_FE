import { NextRequest, NextResponse } from 'next/server';

// ESP32 /capture 엔드포인트를 서버에서 프록시 — CORS 우회용
export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get('ip');
  if (!ip) return NextResponse.json({ error: 'ip required' }, { status: 400 });

  try {
    const res = await fetch(`http://${ip}/capture`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`ESP32 responded ${res.status}`);
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'capture failed' }, { status: 502 });
  }
}
