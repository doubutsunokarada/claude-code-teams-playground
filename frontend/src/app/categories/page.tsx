'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CategoryList } from '@/components/category/CategoryList';
import { useAuth } from '@/hooks/useAuth';

export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <CategoriesContent />
    </ProtectedRoute>
  );
}

function CategoriesContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900">TODO管理アプリ</h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                TODO一覧
              </Link>
              <Link href="/categories" className="font-medium text-blue-600">
                カテゴリ管理
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={logout}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <CategoryList />
      </main>
    </div>
  );
}
