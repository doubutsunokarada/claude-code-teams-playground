'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/Toast';
import { CategoryForm } from './CategoryForm';
import type { Category } from '@/types/api';

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.getCategories();
      setCategories(res.categories);
    } catch {
      setError('カテゴリの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(undefined);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCategory(undefined);
    fetchCategories();
    showToast(editingCategory ? 'カテゴリを更新しました' : 'カテゴリを作成しました');
  };

  const handleDelete = async (category: Category) => {
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    setDeletingId(null);

    try {
      await apiClient.deleteCategory(category.id);
      showToast('カテゴリを削除しました');
    } catch {
      fetchCategories();
      showToast('削除に失敗しました', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">カテゴリ管理</h2>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          新規作成
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            {editingCategory ? 'カテゴリ編集' : 'カテゴリ作成'}
          </h3>
          <CategoryForm
            category={editingCategory}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingCategory(undefined);
            }}
          />
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">読み込み中...</div>
      ) : categories.length === 0 ? (
        <div className="py-8 text-center text-gray-500">カテゴリがありません</div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {category.todo_count !== undefined ? `${category.todo_count}件のTODO` : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  編集
                </button>
                {deletingId === category.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(category)}
                      className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                    >
                      確認
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(category.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    aria-label={`${category.name}を削除`}
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
