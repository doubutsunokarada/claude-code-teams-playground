'use client';

import type { Pagination as PaginationType } from '@/types/api';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, total_pages, total_count } = pagination;

  if (total_pages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">全{total_count}件</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
          aria-label="前のページ"
        >
          前へ
        </button>
        <span className="text-sm text-gray-600">
          {page} / {total_pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
          aria-label="次のページ"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
