import { test, expect } from '@playwright/test';
import { registerAndLogin, createCategory } from './helpers';

test.describe('カテゴリ管理', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('カテゴリ一覧ページに遷移できる', async ({ page }) => {
    await page.getByRole('link', { name: 'カテゴリ管理' }).click();
    await expect(page).toHaveURL(/\/categories/);
    await expect(page.getByText('カテゴリ管理')).toBeVisible();
  });

  test('カテゴリを作成できる', async ({ page }) => {
    await createCategory(page, 'テストカテゴリ', '#FF6B6B');
    await expect(page.getByText('テストカテゴリ')).toBeVisible();
  });

  test('カテゴリを編集できる', async ({ page }) => {
    await createCategory(page, '編集前カテゴリ');

    // 編集ボタンをクリック
    const categoryRow = page.locator('div').filter({ hasText: '編集前カテゴリ' });
    await categoryRow.getByRole('button', { name: '編集' }).click();

    // フォームが表示される
    await expect(page.getByText('カテゴリ編集')).toBeVisible();

    // 名前を変更
    await page.getByLabel(/カテゴリ名/).clear();
    await page.getByLabel(/カテゴリ名/).fill('編集後カテゴリ');
    await page.getByRole('button', { name: '更新' }).click();

    // 更新されていることを確認
    await expect(page.getByText('カテゴリを更新しました')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('編集後カテゴリ')).toBeVisible();
  });

  test('カテゴリを削除できる', async ({ page }) => {
    await createCategory(page, '削除対象カテゴリ');

    // 削除ボタン→確認
    await page.getByRole('button', { name: '削除対象カテゴリを削除' }).click();
    await page.getByRole('button', { name: '確認' }).click();

    // トースト通知
    await expect(page.getByText('カテゴリを削除しました')).toBeVisible({ timeout: 5000 });

    // 一覧から消える
    await expect(page.getByText('削除対象カテゴリ')).not.toBeVisible();
  });

  test('カテゴリ名未入力でバリデーションエラー', async ({ page }) => {
    await page.goto('/categories');
    await page.getByRole('button', { name: '新規作成' }).click();
    await page.getByRole('button', { name: '作成' }).click();

    await expect(page.getByText('カテゴリ名は必須です')).toBeVisible();
  });

  test('カテゴリ作成をキャンセルできる', async ({ page }) => {
    await page.goto('/categories');
    await page.getByRole('button', { name: '新規作成' }).click();

    await expect(page.getByText('カテゴリ作成')).toBeVisible();

    await page.getByRole('button', { name: 'キャンセル' }).click();

    // フォームが閉じる
    await expect(page.getByText('カテゴリ作成')).not.toBeVisible();
  });

  test('TODO一覧とカテゴリ管理をナビゲーションで行き来できる', async ({ page }) => {
    // カテゴリ管理へ
    await page.getByRole('link', { name: 'カテゴリ管理' }).click();
    await expect(page).toHaveURL(/\/categories/);

    // TODO一覧へ
    await page.getByRole('link', { name: 'TODO一覧' }).click();
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  });
});
