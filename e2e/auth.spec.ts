import { test, expect } from '@playwright/test';
import { generateTestUser, registerAndLogin } from './helpers';

test.describe('認証フロー', () => {
  test('ユーザー登録して自動ログインされる', async ({ page }) => {
    const user = generateTestUser();

    await page.goto('/register');
    await page.getByLabel('名前').fill(user.name);
    await page.getByLabel('メールアドレス').fill(user.email);
    await page.getByLabel('パスワード', { exact: true }).fill(user.password);
    await page.getByLabel('パスワード（確認）').fill(user.password);
    await page.getByRole('button', { name: 'アカウント登録' }).click();

    // ダッシュボードに遷移
    await expect(page.getByText('TODO管理アプリ')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(user.name)).toBeVisible();
  });

  test('登録フォームのバリデーション', async ({ page }) => {
    await page.goto('/register');

    // 空のまま送信
    await page.getByRole('button', { name: 'アカウント登録' }).click();
    await expect(page.getByText('名前を入力してください')).toBeVisible();

    // パスワード不一致
    await page.getByLabel('名前').fill('テスト');
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード', { exact: true }).fill('password123');
    await page.getByLabel('パスワード（確認）').fill('different');
    await page.getByRole('button', { name: 'アカウント登録' }).click();
    await expect(page.getByText('パスワードが一致しません')).toBeVisible();
  });

  test('ログイン・ログアウトができる', async ({ page }) => {
    // まず登録
    const user = await registerAndLogin(page);

    // ログアウト
    await page.getByRole('button', { name: 'ログアウト' }).click();
    await expect(page).toHaveURL(/\/login/);

    // ログイン
    await page.getByLabel('メールアドレス').fill(user.email);
    await page.getByLabel('パスワード').fill(user.password);
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('TODO管理アプリ')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(user.name)).toBeVisible();
  });

  test('不正なログイン情報でエラーが表示される', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('nonexistent@example.com');
    await page.getByLabel('パスワード').fill('wrongpassword');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('未認証ユーザーはログインページにリダイレクトされる', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('ログイン画面と登録画面を行き来できる', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: '新規登録' }).click();
    await expect(page).toHaveURL(/\/register/);

    await page.getByRole('link', { name: 'ログイン' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
