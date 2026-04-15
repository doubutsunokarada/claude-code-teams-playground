// ドメインモデル型定義（docs/architecture/domain-model.md に基づく）

export type TodoStatus = 'pending' | 'in_progress' | 'done';
export type TodoPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  todo_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  due_date: string | null;
  category: Category | null;
  created_at: string;
  updated_at: string;
}

// Request types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  category_id?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string | null;
  category_id?: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
}

export interface UpdateUserRequest {
  name?: string;
}

// Response types
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface TodoListResponse {
  todos: Todo[];
  pagination: Pagination;
}

export interface CategoryListResponse {
  categories: Category[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

// Query parameters
export interface TodoQueryParams {
  status?: TodoStatus;
  priority?: TodoPriority;
  category_id?: string;
  search?: string;
  sort?: 'created_at' | 'due_date' | 'priority' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}
