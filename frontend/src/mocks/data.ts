import type { User, Todo, Category } from '@/types/api';

export const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  name: '田中太郎',
  created_at: '2026-04-16T10:00:00Z',
  updated_at: '2026-04-16T10:00:00Z',
};

export const mockCategories: Category[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: '買い物',
    color: '#FF6B6B',
    todo_count: 2,
    created_at: '2026-04-16T10:00:00Z',
    updated_at: '2026-04-16T10:00:00Z',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    name: '仕事',
    color: '#4ECDC4',
    todo_count: 1,
    created_at: '2026-04-16T10:00:00Z',
    updated_at: '2026-04-16T10:00:00Z',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    name: '個人',
    color: '#45B7D1',
    todo_count: 0,
    created_at: '2026-04-16T10:00:00Z',
    updated_at: '2026-04-16T10:00:00Z',
  },
];

export const mockTodos: Todo[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: '牛乳を買う',
    description: '低脂肪乳 1L',
    status: 'pending',
    priority: 'medium',
    due_date: '2026-04-20',
    category: mockCategories[0],
    created_at: '2026-04-16T10:00:00Z',
    updated_at: '2026-04-16T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'プレゼン資料を作る',
    description: '来週の会議用',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-04-18',
    category: mockCategories[1],
    created_at: '2026-04-16T11:00:00Z',
    updated_at: '2026-04-16T11:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: '野菜を買う',
    description: null,
    status: 'done',
    priority: 'low',
    due_date: null,
    category: mockCategories[0],
    created_at: '2026-04-15T09:00:00Z',
    updated_at: '2026-04-16T08:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'ジムに行く',
    description: '週3回のトレーニング',
    status: 'pending',
    priority: 'medium',
    due_date: '2026-04-17',
    category: null,
    created_at: '2026-04-16T12:00:00Z',
    updated_at: '2026-04-16T12:00:00Z',
  },
];

export const mockAccessToken = 'mock-access-token-12345';
export const mockRefreshToken = 'mock-refresh-token-67890';
