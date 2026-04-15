import { test, expect } from '@playwright/test';
import { registerAndLogin, createTodo } from './helpers';

test.describe('フィルタリング・ページネーション', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('ステータスでフィルタリングできる', async ({ page }) => {
    // 異なるステータスのTODOを作成
    await createTodo(page, 'フィルタ未着手TODO');

    // 作成した別TODOを完了にする
    await createTodo(page, 'フィルタ完了TODO');
    const checkbox = page.getByRole('checkbox', { name: /フィルタ完了TODOを完了にする/ });
    await checkbox.click();
    await expect(page.getByText('完了にしました')).toBeVisible({ timeout: 5000 });

    // ステータスフィルタで「完了」を選択
    await page.getByLabel('ステータスフィルター').selectOption('done');

    // 完了TODOのみ表示される
    await expect(page.getByText('フィルタ完了TODO')).toBeVisible();
    await expect(page.getByText('フィルタ未着手TODO')).not.toBeVisible();

    // 「すべて」に戻す
    await page.getByLabel('ステータスフィルター').selectOption('');
    await expect(page.getByText('フィルタ未着手TODO')).toBeVisible();
  });

  test('優先度でフィルタリングできる', async ({ page }) => {
    await createTodo(page, '高優先度TODO', { priority: 'high' });
    await createTodo(page, '低優先度TODO', { priority: 'low' });

    // 高優先度でフィルタ
    await page.getByLabel('優先度フィルター').selectOption('high');

    await expect(page.getByText('高優先度TODO')).toBeVisible();
    await expect(page.getByText('低優先度TODO')).not.toBeVisible();
  });

  test('カテゴリでフィルタリングできる', async ({ page }) => {
    const { createCategory } = await import('./helpers');
    await createCategory(page, 'フィルタ用カテゴリ');

    await createTodo(page, 'カテゴリ付きTODO', { category: 'フィルタ用カテゴリ' });
    await createTodo(page, 'カテゴリなしTODO');

    // カテゴリフィルタで絞り込み
    await page.getByLabel('カテゴリフィルター').selectOption({ label: 'フィルタ用カテゴリ' });

    await expect(page.getByText('カテゴリ付きTODO')).toBeVisible();
    await expect(page.getByText('カテゴリなしTODO')).not.toBeVisible();
  });

  test('TODOがない場合は空メッセージが表示される', async ({ page }) => {
    // 新規ユーザーなのでTODOなし → フィルタで空になるケース
    await page.getByLabel('ステータスフィルター').selectOption('done');
    await expect(page.getByText('TODOがありません')).toBeVisible();
  });
});
