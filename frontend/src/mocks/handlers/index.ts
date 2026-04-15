import { authHandlers } from './auth';
import { todoHandlers, resetTodos } from './todos';
import { categoryHandlers, resetCategories } from './categories';
import { userHandlers, resetUsers } from './users';

export const handlers = [...authHandlers, ...todoHandlers, ...categoryHandlers, ...userHandlers];

export function resetMockState() {
  resetTodos();
  resetCategories();
  resetUsers();
}
