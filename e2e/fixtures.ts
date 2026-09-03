import type { Page } from '@playwright/test';

const ok = <T,>(result: T) => ({ success: true, code: 'OK', message: '성공', result });

// exp가 미래인 아무 토큰. AuthGuard가 만료만 보고 서명은 안 봄
function fakeToken(): string {
  const payload = {
    sub: 'qa@habitooth.test',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.qa`;
}

const RISKS = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const toothStatuses = () =>
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 26, 27, 36, 37, 46, 47].flatMap((n, i) => [
    { toothNumber: n, lesionType: 'PLAQUE', areaRatio: 8 + (i % 17), riskLevel: RISKS[i % 5] },
    { toothNumber: n, lesionType: 'CALCULUS', areaRatio: 4 + (i % 11), riskLevel: RISKS[(i + 2) % 5] },
  ]);

const DATES = ['2026-08-24', '2026-08-26', '2026-08-28', '2026-08-30', '2026-08-31'];

const BODIES: Record<string, unknown> = {
  'user/profile': ok({ userId: 1, email: 'qa@habitooth.test', name: 'QA 테스트', birthDate: '2000-01-01' }),
  'user/notification': ok({ pushNotificationEnabled: true, reportNotificationEnabled: true }),
  'user/status': ok([
    {
      deviceId: 1,
      serialNumber: 'ESP32S3-HABITOOTH-01',
      modelName: 'HabiTooth-Scanner-V1',
      firmwareVersion: '1.0.0',
      lastConnectedAt: '2026-08-31T12:00:00',
      connected: true,
    },
  ]),
  'device/status': ok([
    {
      deviceId: 1,
      serialNumber: 'ESP32S3-HABITOOTH-01',
      modelName: 'HabiTooth-Scanner-V1',
      firmwareVersion: '1.0.0',
      lastConnectedAt: '2026-08-31T12:00:00',
      connected: true,
    },
  ]),
  'dashboard/score': ok({ sessionId: 42, score: 90, scoreDiff: 4, scannedAt: '2026-08-30T12:00:00' }),
  'dashboard/report': ok({
    sessionId: 42,
    scannedAt: '2026-08-30T12:00:00',
    averageScore: 90,
    plaqueRiskLevel: 'MEDIUM',
    calculusRiskLevel: 'HIGH',
  }),
  'dashboard/risk': ok({
    sessionId: 42,
    categories: [
      { lesionType: 'PLAQUE', riskLevel: 'MEDIUM', affectedRatio: 19 },
      { lesionType: 'CALCULUS', riskLevel: 'HIGH', affectedRatio: 28 },
    ],
  }),
  'history/today': ok({
    sessionId: 42,
    date: '2026-08-30',
    time: '12:00:00',
    score: 90,
    riskLevel: 'LOW',
    scoreDiff: 4,
  }),
  'history/graph': ok(DATES.map((date, i) => ({ sessionId: 38 + i, date, score: 78 + i * 3 }))),
  'history/compare': ok(
    DATES.map((date, i) => ({
      sessionId: 38 + i,
      date,
      time: '12:00:00',
      score: 78 + i * 3,
      riskLevel: 'LOW',
    })),
  ),
  'history/list': ok({
    totalCount: DATES.length,
    page: 0,
    size: 20,
    totalPages: 1,
    items: DATES.map((date, i) => ({
      sessionId: 38 + i,
      date,
      score: 78 + i * 3,
      plaqueRiskLevel: 'MEDIUM',
      calculusRiskLevel: 'HIGH',
    })),
  }),
};

export async function mockApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (/\/capture-status$/.test(path)) {
      return route.fulfill({
        json: ok({
          sessionId: 42,
          uploadedImageCount: 11,
          capturedZoneCount: 11,
          totalZoneCount: 13,
          canAnalyze: true,
          capturedZones: [
            'UPPER_RIGHT_MOLAR', 'UPPER_RIGHT_PREMOLAR', 'UPPER_FRONT',
            'UPPER_LEFT_PREMOLAR', 'UPPER_LEFT_MOLAR',
            'LOWER_RIGHT_MOLAR', 'LOWER_RIGHT_PREMOLAR', 'LOWER_FRONT',
            'LOWER_LEFT_PREMOLAR', 'LOWER_LEFT_MOLAR',
            'OUTER_CENTER',
          ].map((viewType, i) => ({ scanImageId: i + 1, viewType, lightType: 'WHITE_LIGHT' })),
        }),
      });
    }

    if (path.startsWith('/api/camera/discover')) {
      return route.fulfill({
        json: { devices: [{ ip: 'habitooth.local', latencyMs: 118, kind: 'wand' }] },
      });
    }
    if (path.startsWith('/api/camera/pending')) {
      return route.fulfill({ json: { seq: 0, w: '', u: '' } });
    }
    if (path.startsWith('/api/camera/capture')) {
      return route.fulfill({ status: 502, json: { error: 'device responded 404' } });
    }

    const report = /\/reports\/scan-sessions\/(\d+)\/simple/.exec(path);
    if (report) {
      return route.fulfill({
        json: ok({
          sessionId: Number(report[1]),
          totalScore: 90,
          summary: { totalPlaqueRatio: 19, totalCalculusRatio: 28 },
          toothStatuses: toothStatuses(),
        }),
      });
    }

    if (/\/llm-report$/.test(path)) {
      // GET으로 가져와야 함. POST면 재생성이라 느림
      if (route.request().method() !== 'GET') {
        return route.fulfill({ status: 500, json: { error: 'POST로 재생성하면 안 됨' } });
      }
      return route.fulfill({
        json: ok({
          sessionId: 42,
          riskDetail: [
            { title: '어금니 안쪽에 치석이 보여요', detail: '칫솔이 잘 안 닿는 자리예요.', riskLevel: 'HIGH' },
            { title: '앞니는 잘 관리되고 있어요', detail: '지금처럼 유지하면 돼요.', riskLevel: 'LOW' },
          ],
          management: [
            { title: '어금니 안쪽을 45도로', detail: '칫솔모를 잇몸 쪽으로 기울여 주세요.' },
            { title: '치실을 하루 한 번', detail: '치아 사이는 칫솔로 안 닿아요.' },
          ],
          disclaimer: '이 결과는 참고용이며 의료 진단이 아니에요.',
        }),
      });
    }

    if (/\/3d$/.test(path)) {
      return route.fulfill({ json: ok({ sessionId: 42, meshData: [] }) });
    }

    for (const [key, body] of Object.entries(BODIES)) {
      if (path.includes(key)) return route.fulfill({ json: body });
    }

    return route.fulfill({ json: ok(null) });
  });
}

export async function signIn(page: Page) {
  await page.addInitScript(
    ([token, deviceIp]) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('userEmail', 'qa@habitooth.test');
      localStorage.setItem('deviceId', '1');
      localStorage.setItem('deviceIp', deviceIp);
      localStorage.setItem('habitooth.dentition', JSON.stringify([18, 28, 38, 48]));
      localStorage.setItem('habitooth.dentition.set', 'true');
    },
    [fakeToken(), 'habitooth.local:81'] as const,
  );
}

export async function freezeMotion(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-play-state: paused !important;
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }`,
  });
}
