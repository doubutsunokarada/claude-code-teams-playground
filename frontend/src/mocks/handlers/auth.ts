import { http, HttpResponse } from 'msw';
import { mockUser, mockAccessToken, mockRefreshToken } from '../data';
import type { LoginRequest, RegisterRequest, RefreshRequest } from '@/types/api';

const API_BASE = 'http://localhost:8080/api/v1';

export const authHandlers = [
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as RegisterRequest;

    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力内容に誤りがあります',
            fields: {
              ...(body.email ? {} : { email: 'メールアドレスは必須です' }),
              ...(body.password ? {} : { password: 'パスワードは必須です' }),
              ...(body.name ? {} : { name: '名前は必須です' }),
            },
          },
        },
        { status: 400 },
      );
    }

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        {
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'このメールアドレスは既に登録されています',
          },
        },
        { status: 409 },
      );
    }

    return HttpResponse.json(
      {
        user: { ...mockUser, email: body.email, name: body.name },
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      },
      { status: 201 },
    );
  }),

  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;

    if (body.email === 'user@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: mockUser,
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      });
    }

    return HttpResponse.json(
      {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      },
      { status: 401 },
    );
  }),

  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as RefreshRequest;

    if (body.refresh_token) {
      return HttpResponse.json({
        access_token: 'new-mock-access-token',
        refresh_token: 'new-mock-refresh-token',
      });
    }

    return HttpResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }),

  http.post(`${API_BASE}/auth/logout`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
        { status: 401 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
