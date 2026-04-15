import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';
import { AuthProvider } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('TodoList', () => {
  beforeEach(async () => {
    apiClient.clearTokens();
    await apiClient.login({ email: 'user@example.com', password: 'password123' });
  });

  it('TODO一覧が表示される', async () => {
    renderWithAuth(<TodoList />);

    expect(await screen.findByText('牛乳を買う')).toBeInTheDocument();
    expect(screen.getByText('プレゼン資料を作る')).toBeInTheDocument();
  });

  it('ステータスバッジが表示される', async () => {
    renderWithAuth(<TodoList />);

    await screen.findByText('牛乳を買う');
    // フィルターのoptionとバッジで重複するためgetAllByTextを使用
    expect(screen.getAllByText('未着手').length).toBeGreaterThanOrEqual(2); // option + badges
    expect(screen.getAllByText('進行中').length).toBeGreaterThanOrEqual(2);
  });

  it('カテゴリバッジが表示される', async () => {
    renderWithAuth(<TodoList />);

    await screen.findByText('牛乳を買う');
    // フィルターのoptionとバッジで重複するためgetAllByTextを使用
    expect(screen.getAllByText('買い物').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('仕事').length).toBeGreaterThanOrEqual(2);
  });

  it('フィルターセレクトが表示される', async () => {
    renderWithAuth(<TodoList />);

    await screen.findByText('牛乳を買う');
    expect(screen.getByLabelText('ステータスフィルター')).toBeInTheDocument();
    expect(screen.getByLabelText('優先度フィルター')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリフィルター')).toBeInTheDocument();
  });

  it('ステータスフィルターで絞り込みできる', async () => {
    const user = userEvent.setup();
    renderWithAuth(<TodoList />);

    await screen.findByText('牛乳を買う');
    await user.selectOptions(screen.getByLabelText('ステータスフィルター'), 'done');

    await screen.findByText('野菜を買う');
    expect(screen.queryByText('牛乳を買う')).not.toBeInTheDocument();
  });

  it('完了TODOにはline-throughスタイルが適用される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<TodoList />);

    await screen.findByText('牛乳を買う');
    await user.selectOptions(screen.getByLabelText('ステータスフィルター'), 'done');

    const doneItem = await screen.findByText('野菜を買う');
    expect(doneItem).toHaveClass('line-through');
  });

  it('TODOがない場合は空メッセージが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<TodoList />);

    await screen.findByText('牛乳を買う');
    // 存在しないカテゴリでフィルタ
    await user.selectOptions(screen.getByLabelText('優先度フィルター'), 'high');
    await user.selectOptions(screen.getByLabelText('ステータスフィルター'), 'done');

    await screen.findByText('TODOがありません');
  });
});
