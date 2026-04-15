import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <ToastProvider>{ui}</ToastProvider>
    </AuthProvider>,
  );
}

describe('TodoList', () => {
  beforeEach(async () => {
    apiClient.clearTokens();
    await apiClient.login({ email: 'user@example.com', password: 'password123' });
  });

  it('TODO一覧が表示される', async () => {
    renderWithProviders(<TodoList />);

    expect(await screen.findByText('牛乳を買う')).toBeInTheDocument();
    expect(screen.getByText('プレゼン資料を作る')).toBeInTheDocument();
  });

  it('ステータスバッジが表示される', async () => {
    renderWithProviders(<TodoList />);

    await screen.findByText('牛乳を買う');
    // フィルターのoptionとバッジで重複するためgetAllByTextを使用
    expect(screen.getAllByText('未着手').length).toBeGreaterThanOrEqual(2); // option + badges
    expect(screen.getAllByText('進行中').length).toBeGreaterThanOrEqual(2);
  });

  it('カテゴリバッジが表示される', async () => {
    renderWithProviders(<TodoList />);

    await screen.findByText('牛乳を買う');
    // フィルターのoptionとバッジで重複するためgetAllByTextを使用
    expect(screen.getAllByText('買い物').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('仕事').length).toBeGreaterThanOrEqual(2);
  });

  it('フィルターセレクトが表示される', async () => {
    renderWithProviders(<TodoList />);

    await screen.findByText('牛乳を買う');
    expect(screen.getByLabelText('ステータスフィルター')).toBeInTheDocument();
    expect(screen.getByLabelText('優先度フィルター')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリフィルター')).toBeInTheDocument();
  });

  it('ステータスフィルターで絞り込みできる', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoList />);

    await screen.findByText('牛乳を買う');
    await user.selectOptions(screen.getByLabelText('ステータスフィルター'), 'done');

    await screen.findByText('野菜を買う');
    expect(screen.queryByText('牛乳を買う')).not.toBeInTheDocument();
  });

  it('完了TODOにはline-throughスタイルが適用される', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoList />);

    await screen.findByText('牛乳を買う');
    await user.selectOptions(screen.getByLabelText('ステータスフィルター'), 'done');

    const doneItem = await screen.findByText('野菜を買う');
    expect(doneItem).toHaveClass('line-through');
  });

  it('TODOがない場合は空メッセージが表示される', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoList />);

    await screen.findByText('牛乳を買う');
    // 存在しないカテゴリでフィルタ
    await user.selectOptions(screen.getByLabelText('優先度フィルター'), 'high');
    await user.selectOptions(screen.getByLabelText('ステータスフィルター'), 'done');

    await screen.findByText('TODOがありません');
  });

  it('チェックボックスで完了切り替えできる', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoList />);

    await screen.findByText('牛乳を買う');
    const checkboxes = screen.getAllByRole('checkbox');
    // 最初の未完了TODOのチェックボックスをクリック
    await user.click(checkboxes[0]);

    // トースト通知が表示される
    await screen.findByText(/完了にしました|未完了に戻しました/);
  });

  it('削除ボタンと確認で削除できる', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodoList />);

    await screen.findByText('牛乳を買う');
    const deleteButtons = screen.getAllByText('削除');
    await user.click(deleteButtons[0]);

    // 確認ダイアログ
    await user.click(screen.getByText('確認'));

    // トースト通知
    await screen.findByText('削除しました');
  });
});
