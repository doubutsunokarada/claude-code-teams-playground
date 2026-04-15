import { http, HttpResponse } from 'msw';
import { mockUser } from '../data';
import type { User, UpdateUserRequest } from '@/types/api';

const API_BASE = 'http://localhost:8080/api/v1';

let currentUser: User = { ...mockUser };

export function resetUsers() {
  currentUser = { ...mockUser };
}

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

export const userHandlers = [
  http.get(`${API_BASE}/users/me`, ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    return HttpResponse.json(currentUser);
  }),

  http.patch(`${API_BASE}/users/me`, async ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    const body = (await request.json()) as UpdateUserRequest;
    currentUser = {
      ...currentUser,
      ...(body.name !== undefined && { name: body.name }),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(currentUser);
  }),
];
