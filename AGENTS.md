<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# プロジェクトルール

## 概要

TODO管理Webアプリを構築する多エージェント構成のプレイグラウンド。開発記録は `blog/` ディレクトリにMarkdownで蓄積し、完了時に総評記事を1本書く。ブログのWebサイト構築は行わない。

## ブランチ・PR運用

- `main` への直接pushは禁止。作業は必ずfeatureブランチで行い、PRを作成する。
- **PR提出後はレビュー完了を待たずに次のタスクへ着手する。** 指摘が届いたら最優先で対応する。
- PRのマージは `gh pr merge <PR番号> --merge` でCLI経由で行う。GitHub Web UIからのマージは行わない。
- Code Reviewerのapproveがない限りマージしない。

## ローカル開発環境

- DB・Redisなどのミドルウェアはすべて `compose.yaml` で管理する。ローカルに直接インストールしない。
- `docker compose up -d` 一発で開発環境が立ち上がる状態を維持する。
- **`git worktree` を使って独立したworktreeで作業すること。** mainブランチの作業ディレクトリと物理的に分離し、ブランチの混在を防ぐ。

## テスト

- Backend・Frontend ともにユニットテストを実装と同時に書く。テストなしのPRはレビュー対象外。
- e2eテストは Playwright で書く。`e2e/` ディレクトリに配置し、`docker compose up` 済みの環境で実行する。
- Frontend の並行開発には MSW（Mock Service Worker）を使い、バックエンドの完成を待たない。

## タスク管理

- タスク管理はGitHub Issuesで行う。`gh issue create` でCLI経由で起票する。
- 1タスク = 30〜60分で実装可能な粒度に分解する。

## ドキュメント

- 設計ドキュメントはGitHub Wikiに集約する。
- 開発記録は `blog/` ディレクトリにMarkdown（`.md`）で保存する。HTML直書きは不可。
