import { NextRequest, NextResponse } from 'next/server';

// 스트림은 가볍게(SVGA) 두고, 분석용 스틸컷만 순간적으로 고해상도로 찍기 위한 세팅
const CAPTURE_FRAMESIZE = 13; // UXGA 1600x1200
const CAPTURE_QUALITY = 6;
const STREAM_FRAMESIZE = 9; // SVGA 800x600 (useCameraStream 세팅과 맞춤)
const STREAM_QUALITY = 10;

const SNAP_TIMEOUT = 15000;
const CAPTURE_TIMEOUT = 8000;

const get = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

// wand 펌웨어: /snap?light=&view= 하나로 조명 켜고 찍고 끄는 것까지 처리
const snapWand = async (ip: string, light: string, view: string) => {
  const query = new URLSearchParams({ light, view, t: String(Date.now()) });
  return get(`http://${ip}/snap?${query}`, SNAP_TIMEOUT);
};

// 예전 CameraWebServer 펌웨어: 해상도를 올렸다가 찍고 다시 내림
const setSensor = async (ip: string, framesize: number, quality: number) => {
  await get(`http://${ip}/control?var=framesize&val=${framesize}`, 3000).catch(() => {});
  await get(`http://${ip}/control?var=quality&val=${quality}`, 3000).catch(() => {});
};

const snapCam = async (ip: string) => {
  await setSensor(ip, CAPTURE_FRAMESIZE, CAPTURE_QUALITY);
  await new Promise((r) => setTimeout(r, 300)); // 센서 설정 반영 대기

  try {
    // 첫 프레임은 설정 변경 전 버퍼가 남아있을 수 있어 버리고 두 번째를 사용
    await get(`http://${ip}/capture?_=${Date.now()}`, CAPTURE_TIMEOUT)
      .then((r) => r.arrayBuffer())
      .catch(() => {});
    return await get(`http://${ip}/capture?_=${Date.now()}`, CAPTURE_TIMEOUT);
  } finally {
    setSensor(ip, STREAM_FRAMESIZE, STREAM_QUALITY);
  }
};

// 기기 촬영을 서버에서 프록시 - CORS 우회용
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const ip = params.get('ip');
  if (!ip) return NextResponse.json({ error: 'ip required' }, { status: 400 });

  const kind = params.get('kind') === 'cam' ? 'cam' : 'wand';
  const light = params.get('light') === 'uv' ? 'uv' : 'white';
  const view = params.get('view') ?? '';

  try {
    const res = kind === 'cam' ? await snapCam(ip) : await snapWand(ip, light, view);
    if (!res.ok) throw new Error(`device responded ${res.status}`);

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) throw new Error('empty image');

    return new NextResponse(buffer, { headers: { 'Content-Type': 'image/jpeg' } });
  } catch (e) {
    const isTimeout = e instanceof Error && e.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'capture timeout' : 'capture failed' },
      { status: 502 },
    );
  }
}
