import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryList } from './CategoryList';
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

describe('CategoryList', () => {
  beforeEach(async () => {
    apiClient.clearTokens();
    await apiClient.login({ email: 'user@example.com', password: 'password123' });
  });

  it('カテゴリ一覧が表示される', async () => {
    renderWithProviders(<CategoryList />);

    expect(await screen.findByText('買い物')).toBeInTheDocument();
    expect(screen.getByText('仕事')).toBeInTheDocument();
    expect(screen.getByText('個人')).toBeInTheDocument();
  });

  it('TODO数が表示される', async () => {
    renderWithProviders(<CategoryList />);

    await screen.findByText('買い物');
    expect(screen.getByText('2件のTODO')).toBeInTheDocument();
  });

  it('新規作成ボタンでフォームが表示される', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryList />);

    await screen.findByText('買い物');
    await user.click(screen.getByRole('button', { name: '新規作成' }));

    expect(screen.getByText('カテゴリ作成')).toBeInTheDocument();
    expect(screen.getByLabelText(/カテゴリ名/)).toBeInTheDocument();
  });

  it('編集ボタンで編集フォームが表示される', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryList />);

    await screen.findByText('買い物');
    const editButtons = screen.getAllByText('編集');
    await user.click(editButtons[0]);

    expect(screen.getByText('カテゴリ編集')).toBeInTheDocument();
  });

  it('削除ボタンで確認ダイアログが表示される', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryList />);

    await screen.findByText('買い物');
    await user.click(screen.getByLabelText('買い物を削除'));

    expect(screen.getByText('確認')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('削除確認で削除が実行されトーストが表示される', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryList />);

    await screen.findByText('買い物');
    await user.click(screen.getByLabelText('買い物を削除'));
    await user.click(screen.getByText('確認'));

    await screen.findByText('カテゴリを削除しました');
  });
});
