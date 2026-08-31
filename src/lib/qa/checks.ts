import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api';
import { authApi } from '@/lib/api/auth';
import { deviceApi } from '@/lib/api/device';
import { scanApi } from '@/lib/api/scan';
import { dashboardApi } from '@/lib/api/dashboard';
import { historyApi } from '@/lib/api/history';
import { userApi } from '@/lib/api/user';
import { reportApi } from '@/lib/api/report';

export type QaGroup = '디바이스' | '스캔 세션' | '대시보드' | '기록' | '마이페이지' | '리포트' | '인증';

export interface QaContext {
  deviceId: number | null;
  sessionId: number | null;
  scanImageId: number | null;
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
  run: (ctx: QaContext) => Promise<AxiosResponse<ApiResponse<unknown>>>;
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

export const QA_CHECKS: QaCheck[] = [
  {
    id: 'device.status',
    group: '디바이스',
    label: '디바이스 상태 조회',
    endpoint: 'GET /api/device/status',
    run: () => deviceApi.getStatus(),
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
    run: () => deviceApi.register(),
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
    id: 'scan.createSession',
    group: '스캔 세션',
    label: '세션 생성',
    endpoint: 'POST /api/scan-sessions',
    optIn: true,
    needs: ['deviceId'],
    run: (ctx) => scanApi.createSession(ctx.deviceId!),
    capture: (result) => (typeof result === 'number' ? { sessionId: result } : {}),
  },
  {
    id: 'scan.captureStatus',
    group: '스캔 세션',
    label: '촬영 진행 상태',
    endpoint: 'GET /api/scan-sessions/{id}/capture-status',
    needs: ['sessionId'],
    run: (ctx) => scanApi.getCaptureStatus(ctx.sessionId!),
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
    run: (ctx) => scanApi.analyzeSession(ctx.sessionId!),
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
    id: 'dashboard.score',
    group: '대시보드',
    label: '오늘의 점수',
    endpoint: 'GET /api/dashboard/score',
    run: () => dashboardApi.getScore(),
    expectKeys: ['sessionId', 'score', 'scoreDiff', 'scannedAt'],
  },
  {
    id: 'dashboard.report',
    group: '대시보드',
    label: '리포트 요약',
    endpoint: 'GET /api/dashboard/report',
    run: () => dashboardApi.getReport(),
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
    run: () => dashboardApi.getRisk(),
    expectKeys: ['sessionId', 'categories'],
  },

  {
    id: 'history.today',
    group: '기록',
    label: '오늘 기록',
    endpoint: 'GET /api/history/today',
    run: () => historyApi.getToday(),
    expectKeys: ['date', 'time', 'score', 'riskLevel', 'scoreDiff'],
  },
  {
    id: 'history.graph',
    group: '기록',
    label: '점수 추이',
    endpoint: 'GET /api/history/graph',
    run: () => historyApi.getScoreTrend(),
    expectItemKeys: ['date', 'score'],
  },
  {
    id: 'history.compare',
    group: '기록',
    label: '지난 기록 비교',
    endpoint: 'GET /api/history/compare',
    run: () => historyApi.getRecords(),
    expectItemKeys: ['date', 'time', 'score', 'riskLevel'],
  },
  {
    id: 'history.list',
    group: '기록',
    label: '전체 목록 (필터, 페이지네이션)',
    endpoint: 'GET /api/history/list',
    run: () => historyApi.getList({ period: 'ALL', scoreFilter: 'ALL', page: 0, size: 5 }),
    expectKeys: ['totalCount', 'page', 'size', 'totalPages', 'items'],
  },

  {
    id: 'user.profile',
    group: '마이페이지',
    label: '프로필 조회',
    endpoint: 'GET /api/user/profile',
    run: () => userApi.getProfile(),
    expectKeys: ['userId', 'email', 'name', 'birthDate'],
  },
  {
    id: 'user.notification',
    group: '마이페이지',
    label: '알림 설정 조회',
    endpoint: 'GET /api/user/notification',
    run: () => userApi.getNotification(),
    expectKeys: ['pushNotificationEnabled', 'reportNotificationEnabled'],
  },
  {
    id: 'user.deviceStatus',
    group: '마이페이지',
    label: '디바이스 상태 (마이페이지용)',
    endpoint: 'GET /api/user/status',
    run: () => userApi.getDeviceStatus(),
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
      return userApi.updateNotification(current.data.result);
    },
    expectKeys: ['pushNotificationEnabled', 'reportNotificationEnabled'],
  },
  {
    id: 'user.deleteData',
    group: '마이페이지',
    label: '기록 전체 삭제 (되돌릴 수 없음)',
    endpoint: 'DELETE /api/user/data',
    manualOnly: true,
    run: () => userApi.deleteData(),
  },

  {
    id: 'report.simple',
    group: '리포트',
    label: '세션 심플 리포트',
    endpoint: 'GET /api/reports/scan-sessions/{id}/simple',
    needs: ['sessionId'],
    run: (ctx) => reportApi.getSessionReport(ctx.sessionId!),
    expectKeys: ['sessionId', 'totalScore', 'summary', 'toothStatuses'],
  },
  {
    id: 'report.mesh',
    group: '리포트',
    label: '3D 좌표 데이터',
    endpoint: 'GET /api/reports/scan-sessions/{id}/3d',
    needs: ['sessionId'],
    run: (ctx) => reportApi.getMeshCoordinates(ctx.sessionId!),
    expectKeys: ['sessionId', 'meshData'],
  },
  {
    id: 'report.singleImage',
    group: '리포트',
    label: '단일 이미지 리포트',
    endpoint: 'GET /api/reports/scan-images/{id}',
    needs: ['scanImageId'],
    run: (ctx) => reportApi.getSingleImageReport(ctx.scanImageId!),
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
    run: (ctx) => reportApi.generateLlmReport(ctx.sessionId!),
    expectKeys: ['sessionId', 'riskDetail', 'management', 'disclaimer'],
  },

  {
    id: 'auth.logout',
    group: '인증',
    label: '로그아웃 (실행하면 다시 로그인해야 함)',
    endpoint: 'POST /api/auth/logout',
    manualOnly: true,
    run: () => authApi.logout(),
  },
];

export const QA_GROUPS: QaGroup[] = [
  '디바이스',
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
