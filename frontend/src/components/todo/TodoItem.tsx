'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Todo } from '@/types/api';
import { TodoStatusBadge } from './TodoStatusBadge';
import { TodoPriorityBadge } from './TodoPriorityBadge';
import { CategoryBadge } from './CategoryBadge';

interface TodoItemProps {
  todo: Todo;
  onToggleDone?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
}

export function TodoItem({ todo, onToggleDone, onDelete }: TodoItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const formattedDate = todo.due_date
    ? new Date(todo.due_date).toLocaleDateString('ja-JP')
    : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {onToggleDone && (
        <input
          type="checkbox"
          checked={todo.status === 'done'}
          onChange={() => onToggleDone(todo)}
          aria-label={`${todo.title}を${todo.status === 'done' ? '未完了に戻す' : '完了にする'}`}
          className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className={`truncate text-sm font-medium ${
              todo.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'
            }`}
          >
            {todo.title}
          </h3>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <TodoStatusBadge status={todo.status} />
          <TodoPriorityBadge priority={todo.priority} />
          {todo.category && <CategoryBadge name={todo.category.name} color={todo.category.color} />}
          {formattedDate && <span className="text-xs text-gray-500">期限: {formattedDate}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/todos/${todo.id}/edit`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          編集
        </Link>
        {onDelete && !showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            aria-label={`${todo.title}を削除`}
          >
            削除
          </button>
        )}
        {onDelete && showConfirm && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onDelete(todo);
                setShowConfirm(false);
              }}
              className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
            >
              確認
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
