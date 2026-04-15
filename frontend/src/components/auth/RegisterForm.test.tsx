import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { AuthProvider } from '@/hooks/useAuth';

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('RegisterForm', () => {
  it('登録フォームが表示される', () => {
    renderWithAuth(<RegisterForm />);

    expect(screen.getByLabelText('名前')).toBeInTheDocument();
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'アカウント登録' })).toBeInTheDocument();
  });

  it('名前未入力でバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: 'アカウント登録' }));

    expect(screen.getByText('名前を入力してください')).toBeInTheDocument();
  });

  it('パスワードが8文字未満でバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterForm />);

    await user.type(screen.getByLabelText('名前'), 'テスト');
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'short');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'short');
    await user.click(screen.getByRole('button', { name: 'アカウント登録' }));

    expect(screen.getByText('パスワードは8文字以上にしてください')).toBeInTheDocument();
  });

  it('パスワード不一致でバリデーションエラーが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterForm />);

    await user.type(screen.getByLabelText('名前'), 'テスト');
    await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'different123');
    await user.click(screen.getByRole('button', { name: 'アカウント登録' }));

    expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
  });

  it('既存メールで登録するとエラーが表示される', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterForm />);

    await user.type(screen.getByLabelText('名前'), 'テスト');
    await user.type(screen.getByLabelText('メールアドレス'), 'existing@example.com');
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
    await user.click(screen.getByRole('button', { name: 'アカウント登録' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('このメールアドレスは既に登録されています');
  });
});
