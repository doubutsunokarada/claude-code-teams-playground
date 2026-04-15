import { authHandlers } from './auth';
import { todoHandlers } from './todos';
import { categoryHandlers } from './categories';
import { userHandlers } from './users';

export const handlers = [...authHandlers, ...todoHandlers, ...categoryHandlers, ...userHandlers];
