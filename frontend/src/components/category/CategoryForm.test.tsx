import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from './CategoryForm';
import { AuthProvider } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import type { Category } from '@/types/api';

const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

const existingCategory: Category = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  name: '買い物',
  color: '#FF6B6B',
  todo_count: 5,
  created_at: '2026-04-16T10:00:00Z',
  updated_at: '2026-04-16T10:00:00Z',
};

describe('CategoryForm', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    apiClient.clearTokens();
    await apiClient.login({ email: 'user@example.com', password: 'password123' });
  });

  it('作成フォームが表示される', () => {
    renderWithAuth(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/カテゴリ名/)).toBeInTheDocument();
    expect(screen.getByLabelText('色')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument();
  });

  it('名前未入力でバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: '作成' }));

    expect(screen.getByText('カテゴリ名は必須です')).toBeInTheDocument();
  });

  it('カテゴリ作成が成功するとonSuccessが呼ばれる', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/カテゴリ名/), 'テストカテゴリ');
    await user.click(screen.getByRole('button', { name: '作成' }));

    await vi.waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
  });

  it('編集モードでは既存データがプリフィルされる', () => {
    renderWithAuth(
      <CategoryForm category={existingCategory} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    expect(screen.getByLabelText(/カテゴリ名/)).toHaveValue('買い物');
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });

  it('キャンセルでonCancelが呼ばれる', async () => {
    const user = userEvent.setup();
    renderWithAuth(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
