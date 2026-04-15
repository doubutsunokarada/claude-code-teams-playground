'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Todo, TodoStatus, TodoPriority, Category, Pagination as PaginationType } from '@/types/api';
import { TodoItem } from './TodoItem';
import { TodoFilter } from './TodoFilter';
import { Pagination } from './Pagination';

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState<TodoStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.getTodos({
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(categoryFilter && { category_id: categoryFilter }),
        page,
        per_page: 20,
      });
      setTodos(res.todos);
      setPagination(res.pagination);
    } catch {
      setError('TODOの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.getCategories();
      setCategories(res.categories);
    } catch {
      // カテゴリ取得失敗はフィルタが使えないだけなので無視
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleStatusChange = (status: TodoStatus | '') => {
    setStatusFilter(status);
    setPage(1);
  };

  const handlePriorityChange = (priority: TodoPriority | '') => {
    setPriorityFilter(priority);
    setPage(1);
  };

  const handleCategoryChange = (categoryId: string) => {
    setCategoryFilter(categoryId);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <TodoFilter
        status={statusFilter}
        priority={priorityFilter}
        categoryId={categoryFilter}
        categories={categories}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onCategoryChange={handleCategoryChange}
      />

      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">読み込み中...</div>
      ) : todos.length === 0 ? (
        <div className="py-8 text-center text-gray-500">TODOがありません</div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}

      {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
    </div>
  );
}
