import { test, expect } from '@playwright/test';
import { mockApi, signIn } from './fixtures';

test.use({ channel: 'msedge' });
// 리포트 상단에서 치아를 고르면 그 치아로 당겨 보고, 넘기고, 돌아올 수 있어야 한다
test('report hero focuses a tooth and steps through risky teeth', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await signIn(page);
  await mockApi(page);
  await page.goto('/report/42', { waitUntil: 'domcontentloaded' });
  const inside = page.getByRole('button', { name: '안쪽 보기', exact: true });
  await expect(inside).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/신경 쓸 치아 \d+개/)).toBeVisible();

  // 칩으로 첫 치아 선택
  await page
    .getByRole('button', { name: /^\d{2}번 (치석|치태)$/ })
    .first()
    .click();
  await expect(page.getByText(/^1 \/ \d+ 신경 쓸 치아$/)).toBeVisible();
  await expect(page.getByText(/^FDI \d{2}$/)).toBeVisible();
  await expect(inside).toBeHidden();

  // 다음 치아로 넘기면 카운터가 2가 된다
  await page.getByRole('button', { name: '다음 치아' }).click();
  await expect(page.getByText(/^2 \/ \d+ 신경 쓸 치아$/)).toBeVisible();

  // 16번은 바깥쪽 치석과 안쪽 치태가 같이 있어 보기 토글이 뜬다
  await page.getByRole('button', { name: '전체 보기' }).click();
  await page.getByRole('button', { name: '16번 치석' }).click();
  await expect(page.getByText('FDI 16')).toBeVisible();
  const innerView = page.getByRole('button', { name: '치태 · 안쪽' });
  await expect(page.getByRole('button', { name: '치석 · 바깥쪽' })).toHaveAttribute('aria-pressed', 'true');
  await innerView.click();
  await expect(innerView).toHaveAttribute('aria-pressed', 'true');

  // 전체 보기로 돌아오면 포즈 버튼이 다시 보인다
  await page.getByRole('button', { name: '전체 보기' }).click();
  await expect(inside).toBeVisible();
  expect(errors).toEqual([]);
});
