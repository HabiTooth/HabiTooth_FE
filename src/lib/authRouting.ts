import { deviceApi } from './api/device';

// 로그인 직후 목적지 분기: 계정에 등록된 디바이스가 있으면 홈, 없으면 최초 페어링
export async function destinationAfterLogin(): Promise<string> {
  try {
    const res = await deviceApi.getStatus();
    return res.data.result.length > 0 ? '/dashboard' : '/pairing';
  } catch {
    // 상태 조회 실패 시 홈으로 - 401이면 인터셉터가 알아서 로그인으로 보냄
    return '/dashboard';
  }
}
