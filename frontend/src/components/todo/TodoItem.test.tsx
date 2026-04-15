import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem } from './TodoItem';
import type { Todo } from '@/types/api';

const baseTodo: Todo = {
  id: '1',
  title: 'テストTODO',
  description: 'テスト説明',
  status: 'pending',
  priority: 'medium',
  due_date: '2026-04-20',
  category: { id: 'c1', name: 'テストカテゴリ', color: '#FF0000', created_at: '', updated_at: '' },
  created_at: '2026-04-16T10:00:00Z',
  updated_at: '2026-04-16T10:00:00Z',
};

describe('TodoItem', () => {
  it('タイトルが表示される', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('テストTODO')).toBeInTheDocument();
  });

  it('ステータスバッジが表示される', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('未着手')).toBeInTheDocument();
  });

  it('優先度バッジが表示される', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('中')).toBeInTheDocument();
  });

  it('カテゴリが表示される', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText('テストカテゴリ')).toBeInTheDocument();
  });

  it('期日が表示される', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.getByText(/2026\/4\/20/)).toBeInTheDocument();
  });

  it('カテゴリなしの場合、カテゴリバッジが表示されない', () => {
    render(<TodoItem todo={{ ...baseTodo, category: null }} />);
    expect(screen.queryByText('テストカテゴリ')).not.toBeInTheDocument();
  });

  it('完了TODOはline-throughスタイルが適用される', () => {
    render(<TodoItem todo={{ ...baseTodo, status: 'done' }} />);
    expect(screen.getByText('テストTODO')).toHaveClass('line-through');
  });

  it('チェックボックスで完了切り替えができる', async () => {
    const onToggleDone = vi.fn();
    const user = userEvent.setup();
    render(<TodoItem todo={baseTodo} onToggleDone={onToggleDone} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);

    expect(onToggleDone).toHaveBeenCalledWith(baseTodo);
  });

  it('完了TODOのチェックボックスはチェック済み', () => {
    render(<TodoItem todo={{ ...baseTodo, status: 'done' }} onToggleDone={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('削除ボタンで確認ダイアログが表示される', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TodoItem todo={baseTodo} onDelete={onDelete} />);

    await user.click(screen.getByLabelText('テストTODOを削除'));

    expect(screen.getByText('確認')).toBeInTheDocument();
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('削除確認で削除が実行される', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TodoItem todo={baseTodo} onDelete={onDelete} />);

    await user.click(screen.getByLabelText('テストTODOを削除'));
    await user.click(screen.getByText('確認'));

    expect(onDelete).toHaveBeenCalledWith(baseTodo);
  });

  it('削除取消でダイアログが閉じる', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={baseTodo} onDelete={vi.fn()} />);

    await user.click(screen.getByLabelText('テストTODOを削除'));
    await user.click(screen.getByText('取消'));

    expect(screen.queryByText('確認')).not.toBeInTheDocument();
    expect(screen.getByLabelText('テストTODOを削除')).toBeInTheDocument();
  });

  it('onToggleDoneが未定義ならチェックボックスは非表示', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('onDeleteが未定義なら削除ボタンは非表示', () => {
    render(<TodoItem todo={baseTodo} />);
    expect(screen.queryByLabelText('テストTODOを削除')).not.toBeInTheDocument();
  });
});
