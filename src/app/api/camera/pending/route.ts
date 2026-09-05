import { NextRequest, NextResponse } from 'next/server';

// 기기 하드웨어 셔터로 찍은 컷을 가져오는 프록시 (CORS 우회용)
// wand 펌웨어는 버튼을 누르면 백색광/UV 두 장을 들고 있다가 /pend 로 넘겨준다.
// 이걸 안 가져가면 기기가 촬영 상태에 머물러서 스트림도 멈추고 /snap 도 실패한다.

// 기기가 스트림 때문에 바쁘면 어차피 다음 폴에서 다시 묻는다. 오래 붙잡지 않는다
const PENDING_TIMEOUT = 1500;
const IMAGE_TIMEOUT = 10000;

const get = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const ip = params.get('ip');
  if (!ip) return NextResponse.json({ error: 'ip required' }, { status: 400 });

  const index = params.get('i');

  try {
    if (index === null) {
      const res = await get(`http://${ip}/pending`, PENDING_TIMEOUT);
      if (!res.ok) throw new Error(`device responded ${res.status}`);
      return NextResponse.json(await res.json());
    }

    const i = index === '1' ? 1 : 0;
    const res = await get(`http://${ip}/pend?i=${i}&t=${Date.now()}`, IMAGE_TIMEOUT);
    if (!res.ok) throw new Error(`device responded ${res.status}`);

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) throw new Error('empty image');

    return new NextResponse(buffer, { headers: { 'Content-Type': 'image/jpeg' } });
  } catch (e) {
    const isTimeout = e instanceof Error && e.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'pending timeout' : (e as Error).message },
      { status: 502 },
    );
  }
}
