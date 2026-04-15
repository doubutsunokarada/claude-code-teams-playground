'use client';

import type { TodoStatus, TodoPriority } from '@/types/api';
import type { Category } from '@/types/api';

interface TodoFilterProps {
  status: TodoStatus | '';
  priority: TodoPriority | '';
  categoryId: string;
  categories: Category[];
  onStatusChange: (status: TodoStatus | '') => void;
  onPriorityChange: (priority: TodoPriority | '') => void;
  onCategoryChange: (categoryId: string) => void;
}

export function TodoFilter({
  status,
  priority,
  categoryId,
  categories,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
}: TodoFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        aria-label="ステータスフィルター"
        value={status}
        onChange={(e) => onStatusChange(e.target.value as TodoStatus | '')}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">すべてのステータス</option>
        <option value="pending">未着手</option>
        <option value="in_progress">進行中</option>
        <option value="done">完了</option>
      </select>
      <select
        aria-label="優先度フィルター"
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as TodoPriority | '')}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">すべての優先度</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
      <select
        aria-label="カテゴリフィルター"
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">すべてのカテゴリ</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
