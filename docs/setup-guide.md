# セットアップガイド

TODO管理Webアプリの開発環境構築手順を説明します。

## 前提条件

開発を始める前に、以下がインストールされていることを確認してください。

### 必須

| ツール | バージョン | インストール手順 |
|---|---|---|
| Git | 2.30+ | https://git-scm.com/downloads |
| Docker | 20.10+ | https://docs.docker.com/get-docker/ |
| Docker Compose | 2.0+ | Docker Desktop に含まれます |
| Node.js | 18.17+ / 20.x | https://nodejs.org/ja/ |
| npm | 8.0+ | Node.js に含まれます |
| Go | 1.23+ | https://golang.org/dl/ |

### 推奨

- Visual Studio Code または JetBrains IDE
- PostgreSQL クライアント（ローカル接続用）
- Redis CLI（キャッシュ確認用）

---

## リポジトリのクローン

```bash
git clone https://github.com/sonicmoov/automation-tasks-playground.git
cd automation-tasks-playground
```

---

## ローカル開発環境の起動

### ステップ1: ミドルウェア（PostgreSQL・Redis）の起動

```bash
docker compose up -d postgres redis
```

コンテナが正常に起動したことを確認:

```bash
docker compose ps
```

出力例:
```
NAME                COMMAND                  SERVICE     STATUS       PORTS
postgres            "postgres"               postgres    Up 2 minutes 5432/tcp
redis               "redis-server"           redis       Up 2 minutes 6379/tcp
```

### ステップ2: Backend の起動

**別ターミナルで実行:**

```bash
cd backend
go mod download
go run ./cmd/server
```

または以下で起動（依存関係を自動でダウンロード）:

```bash
cd backend && go run ./cmd/server
```

起動完了時のログ:
```
[2026-04-16T10:00:00Z] INFO Backend listening on :8080
```

### ステップ3: Frontend の起動

**別ターミナルで実行:**

```bash
cd frontend
npm install
npm run dev
```

起動完了時のログ:
```
> next dev
  ▲ Next.js 15.x
  - Local:        http://localhost:3000
```

### ステップ4: アプリへのアクセス

ブラウザで http://localhost:3000 にアクセスしてください。

---

## 環境変数の設定

### Backend（Go）

Backend は `compose.yaml` で定義された環境変数を使用します。カスタマイズが必要な場合:

```bash
cd backend
cp .env.example .env  # 例ファイルがあれば
```

`.env` ファイル（またはシステム環境変数）で設定:

| 変数 | デフォルト | 説明 |
|---|---|---|
| `DB_HOST` | `postgres` | PostgreSQL ホスト |
| `DB_PORT` | `5432` | PostgreSQL ポート |
| `DB_USER` | `todo_user` | PostgreSQL ユーザー |
| `DB_PASSWORD` | `todo_password` | PostgreSQL パスワード |
| `DB_NAME` | `todo_app` | PostgreSQL データベース名 |
| `REDIS_HOST` | `redis` | Redis ホスト |
| `REDIS_PORT` | `6379` | Redis ポート |
| `JWT_SECRET` | `dev-secret-key-change-in-production` | JWT署名キー（開発用） |
| `APP_ENV` | `development` | 実行環境（development/production） |

**注意:** `JWT_SECRET` は開発時は固定値でも構いませんが、本番環境では強力なランダム値に変更してください。

### Frontend（Next.js）

`.env.local` ファイルを作成（git管理外）:

```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_API_MOCKING=disabled
EOF
```

| 変数 | デフォルト | 説明 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | Backend APIベースURL |
| `NEXT_PUBLIC_API_MOCKING` | `disabled` | MSW（モック）有効化（`enabled` で有効） |

**MSWを使用する場合（Backend起動前）:**

```bash
# .env.local
NEXT_PUBLIC_API_MOCKING=enabled
```

---

## テストの実行

### Backend（Go）

ユニットテストの実行:

```bash
cd backend
go test ./...
```

カバレッジレポート付き:

```bash
go test -cover ./...
```

詳細なカバレッジレポート:

```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Frontend（Next.js / Vitest）

ユニットテストの実行:

```bash
cd frontend
npm test
```

ウォッチモード（ファイル変更時に自動実行）:

```bash
npm test -- --watch
```

カバレッジレポート:

```bash
npm test -- --coverage
```

### E2E テスト（Playwright）

Playwright が初期化されていることを確認:

```bash
cd frontend
npx playwright install
```

全てのサービスが起動している状態で実行:

```bash
# Backend/Frontend/DB が全て起動している状態で
npm run e2e
```

または Playwright UI で対話的に実行:

```bash
npx playwright test --ui
```

---

## 開発フロー

### コード変更時

Frontend/Backend のコードを編集すると、自動でホットリロードされます:

- **Frontend**: 保存すると Next.js が自動ビルド・リロード
- **Backend**: ファイル保存時は手動で再起動（`Ctrl+C` → `go run ./cmd/server`）

ホットリロードを自動化したい場合は、`air` などのツールを使用してください:

```bash
# Backend
go install github.com/cosmtrek/air@latest
air  # .air.toml に設定を記載
```

### PR・コミット前の確認

```bash
# Frontend
cd frontend
npm run lint      # ESLint
npm run type-check  # TypeScript型チェック
npm test          # ユニットテスト

# Backend
cd backend
go vet ./...      # 静的チェック
go test ./...     # ユニットテスト
```

---

## よくあるトラブルシューティング

### Backend が `connection refused` エラーで起動しない

**原因**: PostgreSQL/Redis が起動していない

**解決**:

```bash
docker compose ps  # 状態確認
docker compose up -d postgres redis  # 再起動
docker compose logs postgres  # ログ確認
```

### `docker: command not found`

**原因**: Docker がインストールされていない

**解決**: [Docker公式](https://docs.docker.com/get-docker/) からインストール

### Frontend が `EADDRINUSE` エラーで起動しない

**原因**: ポート3000が既に使用されている

**解決**:

```bash
# 別ポートで起動
npm run dev -- -p 3001

# または既存プロセスを確認
lsof -i :3000
kill -9 <PID>
```

### PostgreSQL の初期化に失敗

**原因**: ボリュームが古いデータを保持している

**解決**:

```bash
# 全サービスを停止・リセット
docker compose down -v

# 再起動
docker compose up -d postgres redis
```

### テストが `no such host` エラーで失敗

**原因**: テスト中にサービスが起動していない

**解決**:

```bash
# 別ターミナルで全サービスを起動
docker compose up -d

# Frontend ターミナルで
npm test          # ユニットテスト
npm run e2e       # E2E テスト
```

---

## 開発環境を停止する

### 全サービスを停止（データ保持）

```bash
docker compose stop
```

### 全サービスを停止・削除（リセット）

```bash
docker compose down
```

データベースもリセットする場合:

```bash
docker compose down -v
```

---

## 本番環境へのデプロイ前

以下のチェックリストを実行してください:

- [ ] `.env.local` を `.env.production` にコピー・修正
- [ ] `JWT_SECRET` を強力なランダム値に変更
- [ ] 全テストをパス: `npm test` / `go test ./...`
- [ ] E2E テストをパス: `npm run e2e`
- [ ] `docker compose build` で本番イメージをビルド
- [ ] セキュリティスキャン実行（dependency check など）

---

## ドキュメント

詳細な仕様は以下を参照してください:

- [APIリファレンス](./api-reference.md) — RESTエンドポイント仕様
- [ドメインモデル](./architecture/domain-model.md) — データベース・エンティティ設計
- [Docker Compose 設計](./architecture/compose-design.md) — インフラ構成
- [技術スタック ADR](./architecture/adr-001-tech-stack.md) — 技術選定の背景
