import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from './api-client';

describe('apiClient', () => {
  beforeEach(() => {
    apiClient.clearTokens();
  });

  describe('auth', () => {
    it('ログイン成功時にトークンが保存される', async () => {
      const res = await apiClient.login({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(res.user.email).toBe('user@example.com');
      expect(res.access_token).toBeDefined();
      expect(apiClient.getAccessToken()).toBe(res.access_token);
    });

    it('ログイン失敗時にエラーがスローされる', async () => {
      await expect(
        apiClient.login({ email: 'wrong@example.com', password: 'wrong' }),
      ).rejects.toMatchObject({
        error: { code: 'INVALID_CREDENTIALS' },
      });
    });

    it('ユーザー登録が成功する', async () => {
      const res = await apiClient.register({
        email: 'new@example.com',
        password: 'securepassword123',
        name: 'テストユーザー',
      });

      expect(res.user.name).toBe('テストユーザー');
      expect(res.access_token).toBeDefined();
    });

    it('既存メールでの登録が409エラーになる', async () => {
      await expect(
        apiClient.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'テスト',
        }),
      ).rejects.toMatchObject({
        error: { code: 'EMAIL_ALREADY_EXISTS' },
      });
    });
  });

  describe('todos', () => {
    beforeEach(async () => {
      await apiClient.login({ email: 'user@example.com', password: 'password123' });
    });

    it('TODO一覧を取得できる', async () => {
      const res = await apiClient.getTodos();

      expect(res.todos).toBeDefined();
      expect(res.todos.length).toBeGreaterThan(0);
      expect(res.pagination).toBeDefined();
      expect(res.pagination.page).toBe(1);
    });

    it('ステータスでフィルタリングできる', async () => {
      const res = await apiClient.getTodos({ status: 'pending' });

      expect(res.todos.every((t) => t.status === 'pending')).toBe(true);
    });

    it('TODOを作成できる', async () => {
      const todo = await apiClient.createTodo({
        title: 'テスト用TODO',
        priority: 'high',
      });

      expect(todo.title).toBe('テスト用TODO');
      expect(todo.priority).toBe('high');
      expect(todo.status).toBe('pending');
    });

    it('TODOを更新できる', async () => {
      const list = await apiClient.getTodos();
      const todoId = list.todos[0].id;

      const updated = await apiClient.updateTodo(todoId, { status: 'done' });

      expect(updated.status).toBe('done');
    });
  });

  describe('categories', () => {
    beforeEach(async () => {
      await apiClient.login({ email: 'user@example.com', password: 'password123' });
    });

    it('カテゴリ一覧を取得できる', async () => {
      const res = await apiClient.getCategories();

      expect(res.categories).toBeDefined();
      expect(res.categories.length).toBeGreaterThan(0);
    });

    it('カテゴリを作成できる', async () => {
      const cat = await apiClient.createCategory({
        name: 'テストカテゴリ',
        color: '#123456',
      });

      expect(cat.name).toBe('テストカテゴリ');
      expect(cat.color).toBe('#123456');
    });
  });

  describe('認証なしアクセス', () => {
    it('トークンなしでTODO取得すると401エラーになる', async () => {
      await expect(apiClient.getTodos()).rejects.toMatchObject({
        error: { code: 'UNAUTHORIZED' },
      });
    });
  });
});
