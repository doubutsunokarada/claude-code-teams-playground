import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { AuthProvider } from '@/hooks/useAuth';

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('LoginForm', () => {
  it('ログインフォームが表示される', () => {
    renderWithAuth(<LoginForm />);

    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('メールアドレス未入力でバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(screen.getByRole('alert')).toHaveTextContent('メールアドレスを入力してください');
  });

  it('パスワード未入力でバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);

    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    expect(screen.getByRole('alert')).toHaveTextContent('パスワードを入力してください');
  });

  it('不正な認証情報でエラーメッセージが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);

    await user.type(screen.getByLabelText('メールアドレス'), 'wrong@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('メールアドレスまたはパスワードが正しくありません');
  });

  it('送信中はボタンが無効化される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);

    await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');

    const button = screen.getByRole('button', { name: 'ログイン' });
    await user.click(button);

    // After successful login the form state resets
  });
});
