import axios, { type AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api';
import { authApi } from '@/lib/api/auth';
import { deviceApi } from '@/lib/api/device';
import { scanApi } from '@/lib/api/scan';
import { aiApi } from '@/lib/api/ai';
import { dashboardApi } from '@/lib/api/dashboard';
import { historyApi } from '@/lib/api/history';
import { userApi } from '@/lib/api/user';
import { reportApi } from '@/lib/api/report';

export type QaGroup =
  | '디바이스'
  | '스캐너 연결'
  | '스캔 세션'
  | '대시보드'
  | '기록'
  | '마이페이지'
  | '리포트'
  | '인증';

export interface QaContext {
  deviceId: number | null;
  sessionId: number | null;
  scanImageId: number | null;
}

/** 응답 형태가 제각각이라(봉투 JSON, 이미지, 로컬 라우트) 한 모양으로 맞춘다 */
export interface QaResult {
  status: number;
  success?: boolean;
  message?: string;
  result: unknown;
}

export interface QaCheck {
  id: string;
  group: QaGroup;
  label: string;
  endpoint: string;
  /** 서버 상태를 바꾸거나 오래 걸려서 기본 실행 대상에서 빠지는 항목 */
  optIn?: boolean;
  /** 되돌릴 수 없는 항목. 전체 실행에서 항상 빠지고 개별 실행만 가능하다 */
  manualOnly?: boolean;
  /** 이 값이 없으면 건너뛴다 */
  needs?: Array<keyof QaContext>;
  run: (ctx: QaContext) => Promise<QaResult>;
  /** result 안에 있어야 하는 키. 하나라도 없으면 계약이 어긋난 것 */
  expectKeys?: string[];
  /** 배열 응답이면 첫 원소에서 검사할 키 */
  expectItemKeys?: string[];
  /** 다음 체크가 쓸 값을 뽑아낸다 */
  capture?: (result: unknown) => Partial<QaContext>;
}

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/** null이나 숫자가 아닌 값을 0으로 만들지 않는다 */
const num = (v: unknown): number | null => {
  const n = Number(v);
  return v === null || v === undefined || Number.isNaN(n) ? null : n;
};

const unwrap = (res: AxiosResponse<ApiResponse<unknown>>): QaResult => ({
  status: res.status,
  success: res.data?.success,
  message: res.data?.message,
  result: res.data?.result,
});

/** 업로드 검증용 이미지. 단색이면 품질 판정에 걸리므로 무늬를 넣는다 */
async function syntheticJpeg(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#d8c0b4';
    ctx.fillRect(0, 0, 640, 480);
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = i % 2 ? '#fdfdfb' : '#e8e2dc';
      ctx.fillRect(20 + i * 25, 120 + (i % 3) * 18, 20, 150);
    }
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('QA TEST IMAGE', 180, 80);
  }
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/jpeg', 0.9),
  );
  return new File([blob], 'qa-test.jpg', { type: 'image/jpeg' });
}

export const QA_CHECKS: QaCheck[] = [
  {
    id: 'device.status',
    group: '디바이스',
    label: '디바이스 상태 조회',
    endpoint: 'GET /api/device/status',
    run: () => deviceApi.getStatus().then(unwrap),
    expectItemKeys: [
      'deviceId',
      'serialNumber',
      'modelName',
      'firmwareVersion',
      'lastConnectedAt',
      'connected',
    ],
    capture: (result) => {
      const first = Array.isArray(result) ? asRecord(result[0]) : null;
      return first ? { deviceId: num(first.deviceId) } : {};
    },
  },
  {
    id: 'device.register',
    group: '디바이스',
    label: '디바이스 등록',
    endpoint: 'POST /api/device',
    optIn: true,
    run: () => deviceApi.register().then(unwrap),
    expectKeys: [
      'deviceId',
      'serialNumber',
      'modelName',
      'firmwareVersion',
      'registeredAt',
      'lastConnectedAt',
    ],
    capture: (result) => {
      const r = asRecord(result);
      return r ? { deviceId: num(r.deviceId) } : {};
    },
  },

  {
    id: 'camera.discover',
    group: '스캐너 연결',
    label: '같은 네트워크에서 스캐너 검색 (수십 초 걸림)',
    endpoint: 'GET /api/camera/discover',
    optIn: true,
    run: () =>
      axios
        .get<{ devices: Array<{ ip: string; latencyMs: number }> }>('/api/camera/discover')
        .then((res) => ({ status: res.status, result: res.data })),
    expectKeys: ['devices'],
  },
  {
    id: 'camera.capture',
    group: '스캐너 연결',
    label: '스캐너 스틸컷 촬영 (스캐너가 켜져 있어야 함)',
    endpoint: 'GET /api/camera/capture',
    manualOnly: true,
    run: async () => {
      const ip = (localStorage.getItem('deviceIp') ?? '').split(':')[0];
      if (!ip) {
        return { status: 0, success: false, message: '페어링된 스캐너 IP가 없어요', result: null };
      }
      const res = await axios.get<Blob>(`/api/camera/capture?ip=${ip}`, { responseType: 'blob' });
      return {
        status: res.status,
        result: { contentType: res.data.type, sizeKB: Math.round(res.data.size / 1024) },
      };
    },
    expectKeys: ['contentType', 'sizeKB'],
  },

  {
    id: 'scan.createSession',
    group: '스캔 세션',
    label: '세션 생성',
    endpoint: 'POST /api/scan-sessions',
    optIn: true,
    needs: ['deviceId'],
    run: (ctx) => scanApi.createSession(ctx.deviceId!).then(unwrap),
    capture: (result) => (typeof result === 'number' ? { sessionId: result } : {}),
  },
  {
    id: 'scan.upload',
    group: '스캔 세션',
    label: '테스트 이미지 업로드 (같은 구역이면 서버에서 덮어씀)',
    endpoint: 'POST /api/scan-sessions/{id}/images',
    optIn: true,
    needs: ['sessionId'],
    run: async (ctx) => {
      const file = await syntheticJpeg();
      const res = await scanApi.uploadImageToSession(ctx.sessionId!, {
        file,
        viewType: 'UPPER_FRONT',
        lightType: 'WHITE_LIGHT',
      });
      return unwrap(res);
    },
    expectKeys: ['imageId', 'imageUrl'],
    capture: (result) => {
      const r = asRecord(result);
      return r ? { scanImageId: num(r.imageId) } : {};
    },
  },
  {
    id: 'scan.captureStatus',
    group: '스캔 세션',
    label: '촬영 진행 상태',
    endpoint: 'GET /api/scan-sessions/{id}/capture-status',
    needs: ['sessionId'],
    run: (ctx) => scanApi.getCaptureStatus(ctx.sessionId!).then(unwrap),
    expectKeys: [
      'sessionId',
      'uploadedImageCount',
      'capturedZoneCount',
      'totalZoneCount',
      'canAnalyze',
      'capturedZones',
    ],
    capture: (result) => {
      const r = asRecord(result);
      const zones = Array.isArray(r?.capturedZones) ? r.capturedZones : [];
      const first = asRecord(zones[0]);
      return first ? { scanImageId: num(first.scanImageId) } : {};
    },
  },
  {
    id: 'scan.analyze',
    group: '스캔 세션',
    label: '세션 분석 실행 (오래 걸림)',
    endpoint: 'POST /api/scan-sessions/{id}/analyze',
    optIn: true,
    needs: ['sessionId'],
    run: (ctx) => scanApi.analyzeSession(ctx.sessionId!).then(unwrap),
    expectKeys: [
      'sessionId',
      'sessionScore',
      'validZoneCount',
      'totalZoneCount',
      'invalidZones',
      'failedCount',
      'analysisResults',
    ],
  },
  {
    id: 'ai.analyze',
    group: '스캔 세션',
    label: '단일 이미지 분석 (오래 걸림)',
    endpoint: 'POST /api/ai/analyze',
    optIn: true,
    needs: ['scanImageId'],
    run: (ctx) => aiApi.analyze(ctx.scanImageId!, 'UPPER_FRONT', 'WHITE_LIGHT').then(unwrap),
    expectKeys: [
      'analysisResultId',
      'scanImageId',
      'viewType',
      'status',
      'zoneScore',
      'zoneValid',
      'detectedToothCount',
      'scoreVersion',
      'totalCalculusRatio',
      'totalPlaqueRatio',
      'toothStatuses',
    ],
  },

  {
    id: 'dashboard.score',
    group: '대시보드',
    label: '오늘의 점수',
    endpoint: 'GET /api/dashboard/score',
    run: () => dashboardApi.getScore().then(unwrap),
    expectKeys: ['sessionId', 'score', 'scoreDiff', 'scannedAt'],
  },
  {
    id: 'dashboard.report',
    group: '대시보드',
    label: '리포트 요약',
    endpoint: 'GET /api/dashboard/report',
    run: () => dashboardApi.getReport().then(unwrap),
    expectKeys: ['sessionId', 'scannedAt', 'averageScore', 'plaqueRiskLevel', 'calculusRiskLevel'],
    capture: (result) => {
      const r = asRecord(result);
      return r ? { sessionId: num(r.sessionId) } : {};
    },
  },
  {
    id: 'dashboard.risk',
    group: '대시보드',
    label: '위험도 요약',
    endpoint: 'GET /api/dashboard/risk',
    run: () => dashboardApi.getRisk().then(unwrap),
    expectKeys: ['sessionId', 'categories'],
  },

  {
    id: 'history.today',
    group: '기록',
    label: '오늘 기록',
    endpoint: 'GET /api/history/today',
    run: () => historyApi.getToday().then(unwrap),
    expectKeys: ['date', 'time', 'score', 'riskLevel', 'scoreDiff'],
  },
  {
    id: 'history.graph',
    group: '기록',
    label: '점수 추이',
    endpoint: 'GET /api/history/graph',
    run: () => historyApi.getScoreTrend().then(unwrap),
    expectItemKeys: ['date', 'score'],
  },
  {
    id: 'history.compare',
    group: '기록',
    label: '지난 기록 비교',
    endpoint: 'GET /api/history/compare',
    run: () => historyApi.getRecords().then(unwrap),
    expectItemKeys: ['date', 'time', 'score', 'riskLevel'],
  },
  {
    id: 'history.list',
    group: '기록',
    label: '전체 목록 (필터, 페이지네이션)',
    endpoint: 'GET /api/history/list',
    run: () =>
      historyApi.getList({ period: 'ALL', scoreFilter: 'ALL', page: 0, size: 5 }).then(unwrap),
    expectKeys: ['totalCount', 'page', 'size', 'totalPages', 'items'],
  },

  {
    id: 'user.profile',
    group: '마이페이지',
    label: '프로필 조회',
    endpoint: 'GET /api/user/profile',
    run: () => userApi.getProfile().then(unwrap),
    expectKeys: ['userId', 'email', 'name', 'birthDate'],
  },
  {
    id: 'user.updateProfile',
    group: '마이페이지',
    label: '프로필 수정 (현재 값 그대로 재저장)',
    endpoint: 'PATCH /api/user/profile',
    optIn: true,
    run: async () => {
      const current = (await userApi.getProfile()).data.result;
      const res = await userApi.updateProfile({
        name: current.name,
        birthDate: current.birthDate ?? undefined,
      });
      return unwrap(res);
    },
    expectKeys: ['userId', 'email', 'name', 'birthDate'],
  },
  {
    id: 'user.notification',
    group: '마이페이지',
    label: '알림 설정 조회',
    endpoint: 'GET /api/user/notification',
    run: () => userApi.getNotification().then(unwrap),
    expectKeys: ['pushNotificationEnabled', 'reportNotificationEnabled'],
  },
  {
    id: 'user.deviceStatus',
    group: '마이페이지',
    label: '디바이스 상태 (마이페이지용)',
    endpoint: 'GET /api/user/status',
    run: () => userApi.getDeviceStatus().then(unwrap),
    expectItemKeys: [
      'deviceId',
      'serialNumber',
      'modelName',
      'firmwareVersion',
      'lastConnectedAt',
      'connected',
    ],
  },
  {
    id: 'user.updateNotification',
    group: '마이페이지',
    label: '알림 설정 변경 (현재 값 그대로 재저장)',
    endpoint: 'PATCH /api/user/notification',
    optIn: true,
    run: async () => {
      const current = await userApi.getNotification();
      const res = await userApi.updateNotification(current.data.result);
      return unwrap(res);
    },
    expectKeys: ['pushNotificationEnabled', 'reportNotificationEnabled'],
  },
  {
    id: 'user.deleteData',
    group: '마이페이지',
    label: '기록 전체 삭제 (되돌릴 수 없음)',
    endpoint: 'DELETE /api/user/data',
    manualOnly: true,
    run: () => userApi.deleteData().then(unwrap),
  },

  {
    id: 'report.simple',
    group: '리포트',
    label: '세션 심플 리포트',
    endpoint: 'GET /api/reports/scan-sessions/{id}/simple',
    needs: ['sessionId'],
    run: (ctx) => reportApi.getSessionReport(ctx.sessionId!).then(unwrap),
    expectKeys: ['sessionId', 'totalScore', 'summary', 'toothStatuses'],
  },
  {
    id: 'report.mesh',
    group: '리포트',
    label: '3D 좌표 데이터',
    endpoint: 'GET /api/reports/scan-sessions/{id}/3d',
    needs: ['sessionId'],
    run: (ctx) => reportApi.getMeshCoordinates(ctx.sessionId!).then(unwrap),
    expectKeys: ['sessionId', 'meshData'],
  },
  {
    id: 'report.singleImage',
    group: '리포트',
    label: '단일 이미지 리포트',
    endpoint: 'GET /api/reports/scan-images/{id}',
    needs: ['scanImageId'],
    run: (ctx) => reportApi.getSingleImageReport(ctx.scanImageId!).then(unwrap),
    expectKeys: [
      'analysisResultId',
      'scanImageId',
      'taskId',
      'analysisStatus',
      'viewType',
      'totalScore',
      'recommendation',
      'teeth',
      'issues',
      'createdAt',
    ],
  },
  {
    id: 'report.llm',
    group: '리포트',
    label: 'LLM 리포트 생성 (수 분 걸릴 수 있음)',
    endpoint: 'POST /api/reports/scan-sessions/{id}/llm-report',
    optIn: true,
    needs: ['sessionId'],
    run: (ctx) => reportApi.generateLlmReport(ctx.sessionId!).then(unwrap),
    expectKeys: ['sessionId', 'riskDetail', 'management', 'disclaimer'],
  },

  {
    id: 'auth.signUp',
    group: '인증',
    label: '회원가입 (임시 계정이 실제로 만들어짐)',
    endpoint: 'POST /api/auth/signup',
    manualOnly: true,
    run: () =>
      authApi
        .signUp({
          email: `qa+${Date.now()}@habitooth.test`,
          password: 'QaTest1234!',
          name: 'QA 테스트',
          birthDate: '2000-01-01',
        })
        .then(unwrap),
  },
  {
    id: 'auth.logout',
    group: '인증',
    label: '로그아웃 (실행하면 다시 로그인해야 함)',
    endpoint: 'POST /api/auth/logout',
    manualOnly: true,
    run: () => authApi.logout().then(unwrap),
  },
];

export const QA_GROUPS: QaGroup[] = [
  '디바이스',
  '스캐너 연결',
  '스캔 세션',
  '대시보드',
  '기록',
  '마이페이지',
  '리포트',
  '인증',
];

export function missingKeys(check: QaCheck, result: unknown): string[] {
  if (check.expectKeys) {
    const r = asRecord(result);
    if (!r) return check.expectKeys;
    return check.expectKeys.filter((k) => !(k in r));
  }
  if (check.expectItemKeys) {
    if (!Array.isArray(result) || result.length === 0) return [];
    const first = asRecord(result[0]);
    if (!first) return check.expectItemKeys;
    return check.expectItemKeys.filter((k) => !(k in first));
  }
  return [];
}

export function extraKeys(check: QaCheck, result: unknown): string[] {
  const expected = check.expectKeys ?? check.expectItemKeys;
  if (!expected) return [];
  const target = check.expectKeys
    ? asRecord(result)
    : asRecord(Array.isArray(result) ? result[0] : null);
  if (!target) return [];
  return Object.keys(target).filter((k) => !expected.includes(k));
}
