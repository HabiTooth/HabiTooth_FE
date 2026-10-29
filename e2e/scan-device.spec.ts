import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { mockApi, signIn } from './fixtures';

const ok = (result: unknown) => ({ success: true, code: 'COMMON200', message: '성공', result });
const JPEG = readFileSync('public/images/scan/guide/UPPER_FRONT.webp');

test.use({ viewport: { width: 430, height: 932 } });

// 기기 흉내. snapBumps면 웹 촬영도 seq 증가
async function fakeDevice(page: Page, snapBumps: boolean) {
  const dev = { seq: 27, log: [] as string[] };
  await page.route(/habitooth\.local/, (route) => {
    const url = new URL(route.request().url());
    dev.log.push(url.pathname);
    if (url.pathname === '/stream')
      return route.fulfill({ body: JPEG, contentType: 'image/webp', headers: { 'Access-Control-Allow-Origin': '*' } });
    if (url.pathname === '/pending')
      return route.fulfill({ json: { seq: dev.seq, w: 1, u: 1 }, headers: { 'Access-Control-Allow-Origin': '*' } });
    if (url.pathname === '/pend' || url.pathname === '/snap') {
      if (url.pathname === '/snap' && snapBumps && url.searchParams.get('light') === 'uv') dev.seq += 1;
      return route.fulfill({ body: JPEG, contentType: 'image/jpeg', headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    return route.fulfill({ status: 404, body: '' });
  });
  return dev;
}

async function start(page: Page) {
  await signIn(page);
  await mockApi(page);
  let uploads = 0;
  await page.route(/\/api\/scan-sessions(\?|$)/, (route) => route.fulfill({ json: ok(77) }));
  await page.route(/\/api\/scan-sessions\/77\/images(\?|$)/, (route) => {
    uploads += 1;
    return route.fulfill({ json: ok({ imageId: 500 + uploads }) });
  });
  await page.goto('/scan', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText('위 안내를 모두 확인했어요').click();
  await page.getByRole('button', { name: '스캔 시작하기' }).click();
  return () => uploads;
}

const progress = (page: Page) => page.getByText(/^\d+\/13$/).first().textContent();
const confirm = (page: Page) => page.getByRole('button', { name: /다음|이대로/ }).last();

for (const snapBumps of [false, true]) {
  test(`웹 촬영 버튼으로 3구역 연속 촬영 (snap이 seq 올림: ${snapBumps})`, async ({ page }) => {
    test.setTimeout(180_000);
    await fakeDevice(page, snapBumps);
    const uploads = await start(page);
    const shutter = page.getByRole('button', { name: '촬영', exact: true });
    for (let i = 0; i < 3; i++) {
      await expect(shutter).toBeEnabled({ timeout: 30_000 });
      await shutter.click();
      await expect(confirm(page)).toBeEnabled({ timeout: 30_000 });
      await confirm(page).click();
      await page.waitForTimeout(4000);
      expect(await progress(page)).toBe(`${i + 1}/13`);
      expect(uploads()).toBe((i + 1) * 2);
      await expect(page.getByRole('button', { name: /이대로/ })).toHaveCount(0);
    }
  });
}

test('기기 셔터로 3구역 연속 촬영', async ({ page }) => {
  test.setTimeout(180_000);
  const dev = await fakeDevice(page, false);
  const uploads = await start(page);
  await expect(page.getByRole('button', { name: '촬영', exact: true })).toBeEnabled({ timeout: 30_000 });
  for (let i = 0; i < 3; i++) {
    dev.seq += 1;
    const c = confirm(page);
    await expect(c).toBeEnabled({ timeout: 20_000 });
    await c.click();
    await page.waitForTimeout(1500);
    expect(await progress(page)).toBe(`${i + 1}/13`);
    expect(uploads()).toBe((i + 1) * 2);
  }
});
