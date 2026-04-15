'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TodoForm } from '@/components/todo/TodoForm';
import { apiClient } from '@/lib/api-client';
import type { Todo } from '@/types/api';

export default function EditTodoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .getTodo(id)
      .then(setTodo)
      .catch(() => setError('TODOの取得に失敗しました'));
  }, [id]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">TODO編集</h1>
          <div className="rounded-lg bg-white p-6 shadow">
            {error ? (
              <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : !todo ? (
              <div className="text-gray-500">読み込み中...</div>
            ) : (
              <TodoForm
                todo={todo}
                onSuccess={() => router.push('/')}
                onCancel={() => router.back()}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
