import Link from 'next/link';
import type { Todo } from '@/types/api';
import { TodoStatusBadge } from './TodoStatusBadge';
import { TodoPriorityBadge } from './TodoPriorityBadge';
import { CategoryBadge } from './CategoryBadge';

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const formattedDate = todo.due_date
    ? new Date(todo.due_date).toLocaleDateString('ja-JP')
    : null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
      <Link
        href={`/todos/${todo.id}/edit`}
        className="ml-4 shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
      >
        編集
      </Link>
    </div>
  );
}
