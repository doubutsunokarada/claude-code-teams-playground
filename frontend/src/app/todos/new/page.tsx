'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TodoForm } from '@/components/todo/TodoForm';

export default function NewTodoPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">TODO作成</h1>
          <div className="rounded-lg bg-white p-6 shadow">
            <TodoForm onSuccess={() => router.push('/')} onCancel={() => router.back()} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
