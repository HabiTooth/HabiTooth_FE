import { NextRequest, NextResponse } from 'next/server';

// 스트림은 가볍게(VGA) 두고, 분석용 스틸컷만 순간적으로 고해상도로 찍기 위한 세팅
const CAPTURE_FRAMESIZE = 13; // UXGA 1600x1200
const CAPTURE_QUALITY = 6;
const STREAM_FRAMESIZE = 9; // SVGA 800x600 (useCameraStream 세팅과 맞춤)
const STREAM_QUALITY = 10;

const setSensor = async (ip: string, framesize: number, quality: number) => {
  await fetch(`http://${ip}/control?var=framesize&val=${framesize}`, { cache: 'no-store' }).catch(() => {});
  await fetch(`http://${ip}/control?var=quality&val=${quality}`, { cache: 'no-store' }).catch(() => {});
};

const fetchCapture = async (ip: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`http://${ip}/capture?_=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

// ESP32 /capture 엔드포인트를 서버에서 프록시 — CORS 우회용
export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get('ip');
  if (!ip) return NextResponse.json({ error: 'ip required' }, { status: 400 });

  try {
    await setSensor(ip, CAPTURE_FRAMESIZE, CAPTURE_QUALITY);
    await new Promise((r) => setTimeout(r, 300)); // 센서 설정 반영 대기

    // 첫 프레임은 설정 변경 전 버퍼가 남아있을 수 있어 버리고 두 번째를 사용
    await fetchCapture(ip, 8000).then((r) => r.arrayBuffer()).catch(() => {});
    const res = await fetchCapture(ip, 8000);
    if (!res.ok) throw new Error(`ESP32 responded ${res.status}`);
    const buffer = await res.arrayBuffer();

    setSensor(ip, STREAM_FRAMESIZE, STREAM_QUALITY); // 스트림용 세팅 복구

    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  } catch (e) {
    setSensor(ip, STREAM_FRAMESIZE, STREAM_QUALITY);
    const isTimeout = e instanceof Error && e.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'capture timeout' : 'capture failed' },
      { status: 502 },
    );
  }
}
