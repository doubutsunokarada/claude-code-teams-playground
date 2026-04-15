# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

TODO管理Webアプリを構築する多エージェント構成のプレイグラウンド。開発記録は `blog/` ディレクトリにMarkdownファイルとして蓄積し、プロジェクト完了時に総評記事を1本まとめる。ブログのWebサイト構築は行わない。

## エージェント構成

`/.claude/agents/` に7つの専門エージェントが定義されている：

| ファイル名 | エージェント名 | 役割 |
|---|---|---|
| `project-manager-senior.md` | Senior Project Manager | 仕様書→タスク分解、GitHub Issues管理 |
| `engineering-software-architect.md` | Software Architect | 全体設計・ADR作成、GitHub Wiki管理 |
| `engineering-backend-architect.md` | Backend Architect | DB設計・API実装・インフラ構成・Docker・ユニットテスト |
| `engineering-frontend-developer.md` | Frontend Developer | UI実装・コンポーネント設計・ユニットテスト・Playwright e2e |
| `engineering-code-reviewer.md` | Code Reviewer | PRレビュー、セキュリティ・品質確認 |
| `engineering-technical-writer.md` | Technical Writer | 設計完了後のドキュメント整備 |
| `marketing-book-co-author.md` | Book Co-Author | 勉強記録→ブログ記事化（Markdown必須） |

## 開発フロー

各フェーズ内のエージェントは可能な限り並行して動かす。

```
【フェーズ1】同時並行
  PM             → GitHub Issues にタスク起票（gh issue create）
  Book Co-Author → 観察・記録を開始（プロジェクト全期間継続）

【フェーズ2】
  Software Architect → 全体設計・compose.yaml 構成設計 → GitHub Wiki
                       ↓ APIスキーマ確定次第（完全完成を待たず）即座に次へ

【フェーズ3】同時並行
  Technical Writer   → APIドキュメント先行整備
  Backend Architect  → compose.yaml 実装・API実装・ユニットテスト（git worktree）
  Frontend Developer → MSWでモックして実装・ユニットテスト（git worktree）

【フェーズ4】随時
  Code Reviewer → PR が来たら即レビュー（Backend・Frontend を並行レビュー）
  PR起票者      → Approve後 `gh pr merge <PR番号> --merge` でマージ

【フェーズ5】統合後
  Frontend Developer → Playwright で e2e テスト作成・実行
```

## PR運用ルール

- `main` への直接pushは禁止。必ずPRを作成する。
- **PR提出後は即座に次のタスクへ着手する。** レビュー完了を待って手を止めることは禁止。指摘が届いたら最優先で対応する。
- Code Reviewerのapproveがない限りマージしない。
- マージはGitHub Web UIではなく `gh pr merge <PR番号> --merge` を使う。
- PRタイトル・説明には変更内容と目的を明記する。

## タスク管理

- タスク管理はGitHub Issuesで行う。CLIコマンド `gh issue create` で起票する。
- 1タスク = 30〜60分で実装可能な粒度に分解する。

## テスト規約

- **ミドルウェア（DB・Redisなど）はすべて `compose.yaml` で管理する。** `docker compose up -d` 一発でローカル開発環境が起動できる状態にする。
- **Backend・Frontend ともにユニットテストを実装と同時に書く。** テストなしのPRはレビュー対象外。
- **Playwright で e2e テストを書く。** `e2e/` ディレクトリに配置し、`docker compose up` 済み環境で実行する。

## ドキュメント・コンテンツ規約

- 開発記録は `blog/` ディレクトリにMarkdown形式（`.md`）で保存する。HTML直書きは不可。
- 設計ドキュメントはGitHub Wikiに集約する。
