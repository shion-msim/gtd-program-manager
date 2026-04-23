# GTD プログラム/プロジェクト/タスク マネージャー

個人用のマルチプロジェクト＋GTD型タスク管理（クラウド同期）です。プロダクト要件の一次ソースは `docs/REQUIREMENTS.md`（v0.3）を参照してください。

## 初期セットアップ

1. `.env.example` をコピーして `.env.local` を作成し、`DATABASE_URL`・`AUTH_SECRET`・Google OAuth クライアント情報を入れる。
2. データベースにスキーマを反映: `npm run db:push`（開発）または `npm run db:generate` 後 `npm run db:migrate`。
3. 開発サーバー: `npm run dev` → [http://localhost:3000](http://localhost:3000)

## ドキュメント索引


| ファイル                                                       | 内容                        |
| ---------------------------------------------------------- | ------------------------- |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)               | スコープ、UI、週次負荷、ホスティング       |
| [docs/IMPLEMENTATION-SPEC.md](docs/IMPLEMENTATION-SPEC.md) | タスク状態、REST API、Inbox 初回生成 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | 技術選定、DB、OAuth             |
| [docs/E2E-SCOPE.md](docs/E2E-SCOPE.md)                     | Playwright 最小 E2E         |


## 技術スタック

Next.js 16（App Router）、TypeScript、Tailwind CSS、Drizzle ORM、Neon（Postgres）、Auth.js（Google）、shadcn/ui（[ARCHITECTURE.md](docs/ARCHITECTURE.md) 参照）。

## 実装状況（要約）

- プロジェクト雛形、Drizzle スキーマ（Auth ＋ `programs` / `projects` / `tasks`）、初回 Google 登録時の Inbox 生成、Auth.js＋ミドルウェア、shadcn＋ライト/ダーク切替、ログイン/ダッシュボードの導線まで対応。
- 今後: `IMPLEMENTATION-SPEC.md` の Route Handlers、負荷ビュー、Playwright（`E2E-SCOPE.md`）を順に積み上げる。

## Create Next App

本リポジトリは `create-next-app` で初期化した Next.js プロジェクトを含みます。詳細は [Next.js ドキュメント](https://nextjs.org/docs) を参照してください。