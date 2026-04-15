import { http, HttpResponse } from 'msw';
import { mockCategories } from '../data';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types/api';

const API_BASE = 'http://localhost:8080/api/v1';

let categories = [...mockCategories];

function requireAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return HttpResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }
  return null;
}

export const categoryHandlers = [
  http.get(`${API_BASE}/categories`, ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    return HttpResponse.json({ categories });
  }),

  http.get(`${API_BASE}/categories/:id`, ({ request, params }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const category = categories.find((c) => c.id === params.id);
    if (!category) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: '指定されたカテゴリが見つかりません' } },
        { status: 404 },
      );
    }
    return HttpResponse.json(category);
  }),

  http.post(`${API_BASE}/categories`, async ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = (await request.json()) as CreateCategoryRequest;

    if (!body.name || body.name.length === 0) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力内容に誤りがあります',
            fields: { name: 'カテゴリ名は必須です' },
          },
        },
        { status: 400 },
      );
    }

    if (categories.some((c) => c.name === body.name)) {
      return HttpResponse.json(
        {
          error: {
            code: 'CATEGORY_ALREADY_EXISTS',
            message: '同名のカテゴリが既に存在します',
          },
        },
        { status: 409 },
      );
    }

    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: body.name,
      color: body.color ?? '#808080',
      todo_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    categories.push(newCategory);
    return HttpResponse.json(newCategory, { status: 201 });
  }),

  http.patch(`${API_BASE}/categories/:id`, async ({ request, params }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const index = categories.findIndex((c) => c.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: '指定されたカテゴリが見つかりません' } },
        { status: 404 },
      );
    }

    const body = (await request.json()) as UpdateCategoryRequest;
    const existing = categories[index];

    if (body.name && body.name !== existing.name && categories.some((c) => c.name === body.name)) {
      return HttpResponse.json(
        {
          error: {
            code: 'CATEGORY_ALREADY_EXISTS',
            message: '同名のカテゴリが既に存在します',
          },
        },
        { status: 409 },
      );
    }

    const updated: Category = {
      ...existing,
      ...(body.name !== undefined && { name: body.name }),
      ...(body.color !== undefined && { color: body.color }),
      updated_at: new Date().toISOString(),
    };

    categories[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${API_BASE}/categories/:id`, ({ request, params }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const index = categories.findIndex((c) => c.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: '指定されたカテゴリが見つかりません' } },
        { status: 404 },
      );
    }

    categories.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
