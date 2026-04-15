'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type {
  Todo,
  TodoStatus,
  TodoPriority,
  Category,
  CreateTodoRequest,
  UpdateTodoRequest,
  ApiError,
} from '@/types/api';

interface TodoFormProps {
  todo?: Todo;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TodoForm({ todo, onSuccess, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [status, setStatus] = useState<TodoStatus>(todo?.status ?? 'pending');
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(todo?.due_date ?? '');
  const [categoryId, setCategoryId] = useState(todo?.category?.id ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!todo;

  useEffect(() => {
    apiClient.getCategories().then((res) => setCategories(res.categories)).catch(() => {});
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'タイトルは必須です';
    else if (title.length > 200) errors.title = 'タイトルは200文字以内にしてください';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const data: UpdateTodoRequest = {
          title,
          description: description || undefined,
          status,
          priority,
          due_date: dueDate || null,
          category_id: categoryId || null,
        };
        await apiClient.updateTodo(todo.id, data);
      } else {
        const data: CreateTodoRequest = {
          title,
          ...(description && { description }),
          status,
          priority,
          ...(dueDate && { due_date: dueDate }),
          ...(categoryId && { category_id: categoryId }),
        };
        await apiClient.createTodo(data);
      }
      onSuccess();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.error?.fields) setFieldErrors(apiErr.error.fields);
      setError(apiErr.error?.message || '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="todo-title" className="block text-sm font-medium text-gray-700">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="TODOのタイトル"
        />
        {fieldErrors.title && <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>}
      </div>

      <div>
        <label htmlFor="todo-description" className="block text-sm font-medium text-gray-700">
          説明
        </label>
        <textarea
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="詳細な説明（任意）"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="todo-status" className="block text-sm font-medium text-gray-700">
            ステータス
          </label>
          <select
            id="todo-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TodoStatus)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="pending">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="done">完了</option>
          </select>
        </div>

        <div>
          <label htmlFor="todo-priority" className="block text-sm font-medium text-gray-700">
            優先度
          </label>
          <select
            id="todo-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoPriority)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="todo-due-date" className="block text-sm font-medium text-gray-700">
            期日
          </label>
          <input
            id="todo-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="todo-category" className="block text-sm font-medium text-gray-700">
            カテゴリ
          </label>
          <select
            id="todo-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">なし</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? '保存中...' : isEditing ? '更新' : '作成'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
