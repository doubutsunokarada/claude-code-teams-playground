import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
