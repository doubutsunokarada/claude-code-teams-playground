import type { TodoPriority } from '@/types/api';

const priorityConfig: Record<TodoPriority, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-gray-100 text-gray-600' },
  medium: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
  high: { label: '高', className: 'bg-red-100 text-red-700' },
};

export function TodoPriorityBadge({ priority }: { priority: TodoPriority }) {
  const config = priorityConfig[priority];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
