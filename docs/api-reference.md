# TODO管理Webアプリ APIリファレンス

## 概要

TODO管理WebアプリのREST APIリファレンスです。Backend（Go + Echo）が提供するAPIエンドポイントの仕様を記載しています。

## ベースURL

```
http://localhost:8080/api/v1
```

## 認証

JWTベースのトークン認証を使用します。

- **access_token**: 有効期限15分。リクエストの `Authorization` ヘッダーに付与します。
- **refresh_token**: 有効期限7日。access_token の更新に使用します。Redis に保存され、ログアウト時に無効化されます。

```
Authorization: Bearer <access_token>
```

認証が必要なエンドポイントに `Authorization` ヘッダーなしでリクエストすると、`401 UNAUTHORIZED` エラーが返ります。

---

## エンドポイント一覧

| カテゴリ | メソッド | パス | 説明 | 認証 |
|---|---|---|---|---|
| Auth | POST | `/auth/register` | ユーザー登録 | 不要 |
| Auth | POST | `/auth/login` | ログイン | 不要 |
| Auth | POST | `/auth/refresh` | トークンリフレッシュ | refresh token |
| Auth | POST | `/auth/logout` | ログアウト | 必要 |
| Todo | GET | `/todos` | TODO一覧取得 | 必要 |
| Todo | POST | `/todos` | TODO作成 | 必要 |
| Todo | GET | `/todos/:id` | TODO詳細取得 | 必要 |
| Todo | PATCH | `/todos/:id` | TODO更新 | 必要 |
| Todo | DELETE | `/todos/:id` | TODO削除 | 必要 |
| Category | GET | `/categories` | カテゴリ一覧取得 | 必要 |
| Category | POST | `/categories` | カテゴリ作成 | 必要 |
| Category | GET | `/categories/:id` | カテゴリ詳細取得 | 必要 |
| Category | PATCH | `/categories/:id` | カテゴリ更新 | 必要 |
| Category | DELETE | `/categories/:id` | カテゴリ削除 | 必要 |
| User | GET | `/users/me` | 自分のプロフィール取得 | 必要 |
| User | PATCH | `/users/me` | プロフィール更新 | 必要 |

---

## 認証 (Auth)

### POST /auth/register

ユーザーを新規登録し、トークンを発行します。

**Request Body:**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| email | string | Yes | メールアドレス |
| password | string | Yes | パスワード |
| name | string | Yes | 表示名 |

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "田中太郎"
}
```

**Response `201 Created`:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "田中太郎",
    "created_at": "2026-04-16T10:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Error `409 Conflict`:**

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "このメールアドレスは既に登録されています"
  }
}
```

---

### POST /auth/login

メールアドレスとパスワードでログインし、トークンを発行します。

**Request Body:**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| email | string | Yes | メールアドレス |
| password | string | Yes | パスワード |

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response `200 OK`:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "田中太郎",
    "created_at": "2026-04-16T10:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Error `401 Unauthorized`:**

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

### POST /auth/refresh

refresh_token を使用して新しいトークンペアを取得します。

**Request Body:**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| refresh_token | string | Yes | リフレッシュトークン |

```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Response `200 OK`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "newRefreshToken..."
}
```

---

### POST /auth/logout

現在のセッションをログアウトし、refresh_token を無効化します。

**Headers:** `Authorization: Bearer <access_token>`

**Response `204 No Content`**

レスポンスボディなし。

---

## TODO

全エンドポイント認証必須。レスポンスはリクエストユーザーが所有するTODOのみを返します。他ユーザーのTODOにアクセスすると `404 NOT_FOUND` が返ります。

### リソース構造

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "牛乳を買う",
  "description": "低脂肪乳 1L",
  "status": "pending",
  "priority": "medium",
  "due_date": "2026-04-20",
  "category": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "買い物",
    "color": "#FF6B6B"
  },
  "created_at": "2026-04-16T10:00:00Z",
  "updated_at": "2026-04-16T10:00:00Z"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| id | UUID | TODO ID |
| title | string | タイトル（1〜200文字） |
| description | string \| null | 詳細説明 |
| status | enum | `pending` / `in_progress` / `done` |
| priority | enum | `low` / `medium` / `high` |
| due_date | string \| null | 期日（`YYYY-MM-DD`形式） |
| category | object \| null | 紐づくカテゴリ（なければnull） |
| created_at | string | 作成日時（ISO 8601） |
| updated_at | string | 更新日時（ISO 8601） |

---

### GET /todos

TODO一覧を取得します。フィルタ・ソート・ページネーションに対応しています。

**Query Parameters:**

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| status | string | — | フィルタ: `pending` / `in_progress` / `done` |
| priority | string | — | フィルタ: `low` / `medium` / `high` |
| category_id | UUID | — | フィルタ: カテゴリID |
| search | string | — | タイトル・説明の部分一致検索 |
| sort | string | `created_at` | ソート項目: `created_at` / `due_date` / `priority` / `title` |
| order | string | `desc` | ソート順: `asc` / `desc` |
| page | int | `1` | ページ番号 |
| per_page | int | `20` | 1ページあたり件数（最大100） |

**リクエスト例:**

```
GET /api/v1/todos?status=pending&priority=high&sort=due_date&order=asc&page=1&per_page=10
```

**Response `200 OK`:**

```json
{
  "todos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "牛乳を買う",
      "description": "低脂肪乳 1L",
      "status": "pending",
      "priority": "medium",
      "due_date": "2026-04-20",
      "category": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "買い物",
        "color": "#FF6B6B"
      },
      "created_at": "2026-04-16T10:00:00Z",
      "updated_at": "2026-04-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_count": 42,
    "total_pages": 3
  }
}
```

**ページネーション構造:**

| フィールド | 型 | 説明 |
|---|---|---|
| page | int | 現在のページ番号 |
| per_page | int | 1ページあたり件数 |
| total_count | int | 総件数 |
| total_pages | int | 総ページ数 |

---

### POST /todos

TODOを新規作成します。

**Request Body:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| title | string | Yes | — | タイトル（1〜200文字） |
| description | string | No | null | 詳細説明 |
| status | enum | No | `pending` | `pending` / `in_progress` / `done` |
| priority | enum | No | `medium` | `low` / `medium` / `high` |
| due_date | string | No | null | 期日（`YYYY-MM-DD`形式） |
| category_id | UUID | No | null | カテゴリID |

```json
{
  "title": "牛乳を買う",
  "description": "低脂肪乳 1L",
  "status": "pending",
  "priority": "medium",
  "due_date": "2026-04-20",
  "category_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Response `201 Created`:**

単一のTODOオブジェクトを返します（[リソース構造](#リソース構造)参照）。

---

### GET /todos/:id

指定IDのTODOを取得します。

**Path Parameters:**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | UUID | TODO ID |

**Response `200 OK`:**

単一のTODOオブジェクトを返します（[リソース構造](#リソース構造)参照）。

**Error `404 Not Found`:**

```json
{
  "error": {
    "code": "TODO_NOT_FOUND",
    "message": "指定されたTODOが見つかりません"
  }
}
```

---

### PATCH /todos/:id

TODOを部分更新します。更新したいフィールドのみ送信してください。

**Path Parameters:**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | UUID | TODO ID |

**Request Body:**

更新対象のフィールドのみ含めます。全フィールドの仕様は POST /todos と同じです。

```json
{
  "status": "done"
}
```

**Response `200 OK`:**

更新後のTODOオブジェクトを返します。

---

### DELETE /todos/:id

TODOを削除します。

**Path Parameters:**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | UUID | TODO ID |

**Response `204 No Content`**

レスポンスボディなし。

---

## カテゴリ (Category)

全エンドポイント認証必須。ユーザーごとにカテゴリを管理します。

### リソース構造

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "買い物",
  "color": "#FF6B6B",
  "todo_count": 5,
  "created_at": "2026-04-16T10:00:00Z",
  "updated_at": "2026-04-16T10:00:00Z"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| id | UUID | カテゴリID |
| name | string | カテゴリ名（1〜50文字、ユーザー内で一意） |
| color | string | 表示色（HEXカラー、例: `#FF6B6B`） |
| todo_count | int | 紐づくTODOの件数 |
| created_at | string | 作成日時（ISO 8601） |
| updated_at | string | 更新日時（ISO 8601） |

---

### GET /categories

自分のカテゴリ一覧を取得します。

**Response `200 OK`:**

```json
{
  "categories": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "買い物",
      "color": "#FF6B6B",
      "todo_count": 5,
      "created_at": "2026-04-16T10:00:00Z",
      "updated_at": "2026-04-16T10:00:00Z"
    }
  ]
}
```

---

### POST /categories

カテゴリを新規作成します。

**Request Body:**

| フィールド | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| name | string | Yes | — | カテゴリ名（1〜50文字） |
| color | string | No | `#808080` | 表示色（HEXカラー） |

```json
{
  "name": "買い物",
  "color": "#FF6B6B"
}
```

**Response `201 Created`:**

作成されたカテゴリオブジェクトを返します。

**Error `409 Conflict`:**

```json
{
  "error": {
    "code": "CATEGORY_ALREADY_EXISTS",
    "message": "同名のカテゴリが既に存在します"
  }
}
```

---

### GET /categories/:id

指定IDのカテゴリを取得します。

**Path Parameters:**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | UUID | カテゴリID |

**Response `200 OK`:**

単一のカテゴリオブジェクトを返します。

---

### PATCH /categories/:id

カテゴリを部分更新します。

**Path Parameters:**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | UUID | カテゴリID |

**Request Body:**

更新対象のフィールドのみ含めます。

```json
{
  "name": "食料品",
  "color": "#4ECDC4"
}
```

**Response `200 OK`:**

更新後のカテゴリオブジェクトを返します。

---

### DELETE /categories/:id

カテゴリを削除します。紐づくTODOの `category_id` は `null` に設定されます（カスケード解除）。

**Path Parameters:**

| パラメータ | 型 | 説明 |
|---|---|---|
| id | UUID | カテゴリID |

**Response `204 No Content`**

レスポンスボディなし。

---

## ユーザー (User)

### GET /users/me

ログイン中のユーザーのプロフィールを取得します。

**Response `200 OK`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "田中太郎",
  "created_at": "2026-04-16T10:00:00Z",
  "updated_at": "2026-04-16T10:00:00Z"
}
```

---

### PATCH /users/me

ログイン中のユーザーのプロフィールを更新します。

**Request Body:**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| name | string | No | 表示名 |

```json
{
  "name": "田中次郎"
}
```

**Response `200 OK`:**

更新後のユーザーオブジェクトを返します。

---

## 共通エラーレスポンス

全APIは以下の統一フォーマットでエラーを返します。

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読めるエラーメッセージ"
  }
}
```

### エラーコード一覧

| HTTPステータス | エラーコード | 説明 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | リクエストバリデーション失敗 |
| 401 | `UNAUTHORIZED` | 認証が必要 |
| 401 | `TOKEN_EXPIRED` | トークン期限切れ |
| 401 | `INVALID_CREDENTIALS` | 認証情報が不正 |
| 403 | `FORBIDDEN` | 権限なし |
| 404 | `NOT_FOUND` | リソースが見つからない |
| 404 | `TODO_NOT_FOUND` | 指定されたTODOが見つからない |
| 409 | `CONFLICT` | リソース競合 |
| 409 | `EMAIL_ALREADY_EXISTS` | メールアドレスが登録済み |
| 409 | `CATEGORY_ALREADY_EXISTS` | 同名カテゴリが存在 |
| 429 | `RATE_LIMIT_EXCEEDED` | レートリミット超過 |
| 500 | `INTERNAL_ERROR` | サーバー内部エラー |

### バリデーションエラーの詳細

バリデーションエラーの場合、`fields` フィールドにフィールドごとのエラーメッセージが含まれます。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "fields": {
      "title": "タイトルは必須です",
      "due_date": "日付の形式が正しくありません"
    }
  }
}
```

---

## 認証フロー

```
1. POST /auth/register or POST /auth/login
   → access_token (15分) + refresh_token (7日) を取得

2. 認証が必要なリクエスト
   → Authorization: Bearer <access_token> をヘッダーに付与

3. access_token 期限切れ（401 TOKEN_EXPIRED）
   → POST /auth/refresh で新しいトークンペアを取得

4. ログアウト
   → POST /auth/logout で refresh_token を無効化
```

### Frontend での実装指針

- `access_token` はメモリ内に保持（localStorageに保存しない）
- `refresh_token` は httpOnly cookie または安全なストレージに保存
- APIクライアントに401レスポンスのインターセプターを設定し、自動でトークンリフレッシュを行う
- リフレッシュも失敗した場合はログイン画面にリダイレクト
