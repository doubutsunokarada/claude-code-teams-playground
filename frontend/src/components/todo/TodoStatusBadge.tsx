import type { TodoStatus } from '@/types/api';

const statusConfig: Record<TodoStatus, { label: string; className: string }> = {
  pending: { label: '未着手', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: '進行中', className: 'bg-blue-100 text-blue-700' },
  done: { label: '完了', className: 'bg-green-100 text-green-700' },
};

export function TodoStatusBadge({ status }: { status: TodoStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
