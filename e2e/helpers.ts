import { type Page, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api/v1';

let testUserCounter = 0;

export function generateTestUser() {
  testUserCounter++;
  const timestamp = Date.now();
  return {
    name: `テストユーザー${testUserCounter}`,
    email: `test-e2e-${timestamp}-${testUserCounter}@example.com`,
    password: 'password123',
  };
}

export async function registerAndLogin(page: Page) {
  const user = generateTestUser();

  await page.goto('/register');
  await page.getByLabel('名前').fill(user.name);
  await page.getByLabel('メールアドレス').fill(user.email);
  await page.getByLabel('パスワード', { exact: true }).fill(user.password);
  await page.getByLabel('パスワード（確認）').fill(user.password);
  await page.getByRole('button', { name: 'アカウント登録' }).click();

  // ダッシュボードにリダイレクトされるまで待機
  await expect(page.getByText('TODO管理アプリ')).toBeVisible({ timeout: 10000 });

  return user;
}

export async function createCategory(
  page: Page,
  name: string,
  color?: string,
) {
  await page.goto('/categories');
  await page.getByRole('button', { name: '新規作成' }).click();
  await page.getByLabel(/カテゴリ名/).fill(name);
  if (color) {
    await page.getByLabel('色').fill(color);
  }
  await page.getByRole('button', { name: '作成' }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 5000 });
}

export async function createTodo(
  page: Page,
  title: string,
  options?: { description?: string; priority?: string; category?: string },
) {
  await page.goto('/todos/new');
  await page.getByLabel(/タイトル/).fill(title);

  if (options?.description) {
    await page.getByLabel('説明').fill(options.description);
  }
  if (options?.priority) {
    await page.getByLabel('優先度').selectOption(options.priority);
  }
  if (options?.category) {
    await page.getByLabel('カテゴリ').selectOption({ label: options.category });
  }

  await page.getByRole('button', { name: '作成' }).click();

  // ダッシュボードにリダイレクトされるまで待機
  await expect(page.getByText('TODO管理アプリ')).toBeVisible({ timeout: 5000 });
}
