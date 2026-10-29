import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { mockApi, signIn } from './fixtures';

const ok = (result: unknown) => ({ success: true, code: 'COMMON200', message: '성공', result });
const IMG = readFileSync('public/images/scan/guide/UPPER_FRONT.webp');
const CORS = { 'Access-Control-Allow-Origin': '*' };

async function toAnalysis(page: Page, setup: () => Promise<void>) {
  await signIn(page);
  await mockApi(page);
  await setup();
  await page.route(/habitooth\.local/, (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/pending') return route.fulfill({ json: { seq: 1 }, headers: CORS });
    return route.fulfill({ body: IMG, contentType: 'image/jpeg', headers: CORS });
  });
  await page.route(/\/api\/scan-sessions(\?|$)/, (route) => route.fulfill({ json: ok(77) }));
  await page.route(/\/api\/scan-sessions\/77\/images(\?|$)/, (route) => route.fulfill({ json: ok({ imageId: 501 }) }));
  await page.goto('/scan', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByRole('button', { name: '전체 해제' }).click();
  await page.locator('g[aria-label^="윗니 앞니"]').first().dispatchEvent('click');
  await page.getByText('위 안내를 모두 확인했어요').click();
  await page.getByRole('button', { name: '스캔 시작하기' }).click();
  const shutter = page.getByRole('button', { name: '촬영', exact: true });
  await expect(shutter).toBeEnabled({ timeout: 30_000 });
  await shutter.click();
  const confirm = page.getByRole('button', { name: /이대로/ });
  await expect(confirm).toBeEnabled({ timeout: 30_000 });
  await confirm.click();
}

test.use({ viewport: { width: 430, height: 932 } });

test('응답이 끊겨도 서버가 분석을 끝냈으면 점수 복원', async ({ page }) => {
  test.setTimeout(120_000);
  await toAnalysis(page, async () => {
    await page.route(/\/scan-sessions\/77\/analyze/, (route) => route.fulfill({ status: 504, body: '' }));
    await page.route(/\/reports\/scan-sessions\/77\/zones/, (route) =>
      route.fulfill({ json: ok({ sessionId: 77, sessionScore: 88, validZoneCount: 1, totalZoneCount: 13, zones: [{ viewType: 'UPPER_FRONT', captured: true, zoneValid: true }] }) }),
    );
  });
  await expect(page.getByText('88', { exact: true })).toBeVisible({ timeout: 30_000 });
});

test('서버 오류는 서버 메시지와 코드 표시', async ({ page }) => {
  test.setTimeout(120_000);
  await toAnalysis(page, async () => {
    await page.route(/\/scan-sessions\/77\/analyze/, (route) =>
      route.fulfill({ status: 500, json: { success: false, code: 'AI5001', message: 'AI 서버 오류' } }),
    );
  });
  await expect(page.getByText(/AI 서버 오류/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/AI5001/)).toBeVisible();
});

test('연결이 끊기면 연결 안내', async ({ page }) => {
  test.setTimeout(120_000);
  await toAnalysis(page, async () => {
    await page.route(/\/scan-sessions\/77\/analyze/, (route) => route.abort('connectionreset'));
  });
  await expect(page.getByText(/연결하지 못했어요/)).toBeVisible({ timeout: 30_000 });
});

test('분석 요청이 안 끝나도 서버 결과가 나오면 완료', async ({ page }) => {
  test.setTimeout(120_000);
  let polls = 0;
  await toAnalysis(page, async () => {
    // 응답을 주지 않는 긴 분석
    await page.route(/\/scan-sessions\/77\/analyze/, () => {});
    await page.route(/\/reports\/scan-sessions\/77\/zones/, (route) => {
      polls += 1;
      const finished = polls >= 2;
      return route.fulfill({
        json: ok({
          sessionId: 77,
          sessionScore: finished ? 91 : null,
          validZoneCount: 1,
          totalZoneCount: 13,
          zones: [{ viewType: 'UPPER_FRONT', captured: true, zoneValid: true, zoneScore: finished ? 91 : null }],
        }),
      });
    });
  });
  await expect(page.getByText(/0\/1구역 분석 완료/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: '홈에서 기다리기' })).toBeVisible();
  await expect(page.getByText('91', { exact: true })).toBeVisible({ timeout: 40_000 });
});
