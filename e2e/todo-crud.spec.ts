import { test, expect } from '@playwright/test';
import { registerAndLogin, createTodo, createCategory } from './helpers';

test.describe('TODO CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('TODOを作成できる', async ({ page }) => {
    await createTodo(page, 'E2Eテスト用TODO', {
      description: 'テスト説明文',
      priority: 'high',
    });

    // 一覧に表示される
    await expect(page.getByText('E2Eテスト用TODO')).toBeVisible();
    await expect(page.getByText('高')).toBeVisible();
  });

  test('TODOを編集できる', async ({ page }) => {
    await createTodo(page, '編集前TODO');

    // 編集リンクをクリック
    const todoRow = page.locator('div').filter({ hasText: '編集前TODO' });
    await todoRow.getByRole('link', { name: '編集' }).click();

    // タイトルを変更
    await page.getByLabel(/タイトル/).clear();
    await page.getByLabel(/タイトル/).fill('編集後TODO');
    await page.getByRole('button', { name: '更新' }).click();

    // 一覧に反映
    await expect(page.getByText('編集後TODO')).toBeVisible();
    await expect(page.getByText('編集前TODO')).not.toBeVisible();
  });

  test('TODOを削除できる', async ({ page }) => {
    await createTodo(page, '削除対象TODO');

    // 削除ボタン→確認
    const todoRow = page.locator('div').filter({ hasText: '削除対象TODO' });
    await todoRow.getByRole('button', { name: /削除/ }).click();
    await todoRow.getByRole('button', { name: '確認' }).click();

    // トースト通知が表示される
    await expect(page.getByText('削除しました')).toBeVisible({ timeout: 5000 });

    // 一覧から消える
    await expect(page.getByText('削除対象TODO')).not.toBeVisible();
  });

  test('TODOの完了切り替えができる', async ({ page }) => {
    await createTodo(page, '完了切替TODO');

    // チェックボックスをクリック
    const checkbox = page.getByRole('checkbox', { name: /完了切替TODOを完了にする/ });
    await checkbox.click();

    // トースト通知
    await expect(page.getByText('完了にしました')).toBeVisible({ timeout: 5000 });

    // 再度クリックで未完了に戻す
    await page.getByRole('checkbox', { name: /完了切替TODOを未完了に戻す/ }).click();
    await expect(page.getByText('未完了に戻しました')).toBeVisible({ timeout: 5000 });
  });

  test('タイトルなしでTODO作成するとバリデーションエラー', async ({ page }) => {
    await page.goto('/todos/new');
    await page.getByRole('button', { name: '作成' }).click();

    await expect(page.getByText('タイトルは必須です')).toBeVisible();
  });

  test('キャンセルで一覧に戻る', async ({ page }) => {
    await page.goto('/todos/new');
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // ダッシュボードに戻る
    await expect(page.getByText('TODO管理アプリ')).toBeVisible();
  });

  test('カテゴリ付きTODOを作成できる', async ({ page }) => {
    // カテゴリを先に作成
    await createCategory(page, 'E2Eカテゴリ', '#FF0000');

    // カテゴリ付きTODOを作成
    await createTodo(page, 'カテゴリ付きTODO', { category: 'E2Eカテゴリ' });

    // 一覧でカテゴリが表示される
    await expect(page.getByText('カテゴリ付きTODO')).toBeVisible();
    await expect(page.getByText('E2Eカテゴリ')).toBeVisible();
  });
});
