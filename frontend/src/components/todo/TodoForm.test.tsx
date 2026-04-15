import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoForm } from './TodoForm';
import { AuthProvider } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import type { Todo } from '@/types/api';

const mockOnSuccess = vi.fn();
const mockOnCancel = vi.fn();

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

const existingTodo: Todo = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  title: '既存TODO',
  description: 'テスト説明',
  status: 'pending',
  priority: 'high',
  due_date: '2026-04-20',
  category: { id: '660e8400-e29b-41d4-a716-446655440001', name: '買い物', color: '#FF6B6B', created_at: '', updated_at: '' },
  created_at: '2026-04-16T10:00:00Z',
  updated_at: '2026-04-16T10:00:00Z',
};

describe('TodoForm', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    apiClient.clearTokens();
    await apiClient.login({ email: 'user@example.com', password: 'password123' });
  });

  it('作成フォームが表示される', () => {
    renderWithAuth(<TodoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
    expect(screen.getByLabelText('説明')).toBeInTheDocument();
    expect(screen.getByLabelText('ステータス')).toBeInTheDocument();
    expect(screen.getByLabelText('優先度')).toBeInTheDocument();
    expect(screen.getByLabelText('期日')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
  });

  it('タイトル未入力でバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<TodoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: '作成' }));

    expect(screen.getByText('タイトルは必須です')).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('TODO作成が成功するとonSuccessが呼ばれる', async () => {
    const user = userEvent.setup();
    renderWithAuth(<TodoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/タイトル/), 'テストTODO');
    await user.click(screen.getByRole('button', { name: '作成' }));

    await vi.waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
  });

  it('キャンセルボタンでonCancelが呼ばれる', async () => {
    const user = userEvent.setup();
    renderWithAuth(<TodoForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('編集モードでは既存データがプリフィルされる', () => {
    renderWithAuth(
      <TodoForm todo={existingTodo} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    expect(screen.getByLabelText(/タイトル/)).toHaveValue('既存TODO');
    expect(screen.getByLabelText('説明')).toHaveValue('テスト説明');
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });

  it('編集モードで更新が成功するとonSuccessが呼ばれる', async () => {
    const user = userEvent.setup();
    renderWithAuth(
      <TodoForm todo={existingTodo} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
    );

    await user.clear(screen.getByLabelText(/タイトル/));
    await user.type(screen.getByLabelText(/タイトル/), '更新後TODO');
    await user.click(screen.getByRole('button', { name: '更新' }));

    await vi.waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
  });
});
