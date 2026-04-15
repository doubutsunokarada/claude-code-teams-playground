import { http, HttpResponse } from 'msw';
import { mockTodos, mockCategories } from '../data';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '@/types/api';

const API_BASE = 'http://localhost:8080/api/v1';

let todos = [...mockTodos];

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

export const todoHandlers = [
  http.get(`${API_BASE}/todos`, ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const categoryId = url.searchParams.get('category_id');
    const search = url.searchParams.get('search');
    const sort = url.searchParams.get('sort') || 'created_at';
    const order = url.searchParams.get('order') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '20');

    let filtered = [...todos];

    if (status) filtered = filtered.filter((t) => t.status === status);
    if (priority) filtered = filtered.filter((t) => t.priority === priority);
    if (categoryId) filtered = filtered.filter((t) => t.category?.id === categoryId);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q),
      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sort as keyof Todo] ?? '';
      const bVal = b[sort as keyof Todo] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return order === 'asc' ? cmp : -cmp;
    });

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / perPage);
    const start = (page - 1) * perPage;
    const paged = filtered.slice(start, start + perPage);

    return HttpResponse.json({
      todos: paged,
      pagination: { page, per_page: perPage, total_count: totalCount, total_pages: totalPages },
    });
  }),

  http.get(`${API_BASE}/todos/:id`, ({ request, params }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const todo = todos.find((t) => t.id === params.id);
    if (!todo) {
      return HttpResponse.json(
        { error: { code: 'TODO_NOT_FOUND', message: '指定されたTODOが見つかりません' } },
        { status: 404 },
      );
    }
    return HttpResponse.json(todo);
  }),

  http.post(`${API_BASE}/todos`, async ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = (await request.json()) as CreateTodoRequest;

    if (!body.title || body.title.length === 0) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力内容に誤りがあります',
            fields: { title: 'タイトルは必須です' },
          },
        },
        { status: 400 },
      );
    }

    const category = body.category_id
      ? mockCategories.find((c) => c.id === body.category_id) ?? null
      : null;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? 'pending',
      priority: body.priority ?? 'medium',
      due_date: body.due_date ?? null,
      category: category ? { id: category.id, name: category.name, color: category.color, created_at: category.created_at, updated_at: category.updated_at } : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    todos.unshift(newTodo);
    return HttpResponse.json(newTodo, { status: 201 });
  }),

  http.patch(`${API_BASE}/todos/:id`, async ({ request, params }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const index = todos.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'TODO_NOT_FOUND', message: '指定されたTODOが見つかりません' } },
        { status: 404 },
      );
    }

    const body = (await request.json()) as UpdateTodoRequest;
    const existing = todos[index];

    let category = existing.category;
    if (body.category_id !== undefined) {
      category = body.category_id
        ? mockCategories.find((c) => c.id === body.category_id) ?? null
        : null;
    }

    const updated: Todo = {
      ...existing,
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.due_date !== undefined && { due_date: body.due_date }),
      category,
      updated_at: new Date().toISOString(),
    };

    todos[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete(`${API_BASE}/todos/:id`, ({ request, params }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const index = todos.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'TODO_NOT_FOUND', message: '指定されたTODOが見つかりません' } },
        { status: 404 },
      );
    }

    todos.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
