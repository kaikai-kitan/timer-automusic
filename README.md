# 集中タイマー × BGM (SvelteKit)

タイマー時間を設定すると、YouTube Data API から作業用BGM動画を自動取得し、再生開始するアプリ。

## 構成

- **フロント**: SvelteKit + Svelte 4
- **デプロイ先**: Vercel (`@sveltejs/adapter-vercel`)
- **外部API**: YouTube Data API v3 / YouTube IFrame Player API

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. YouTube Data API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「APIとサービス」→「ライブラリ」で **YouTube Data API v3** を有効化
3. 「認証情報」→「APIキーを作成」
4. 推奨: 作成したAPIキーに「APIキーの制限」をかけ、YouTube Data API v3 のみ許可

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を開いて `YOUTUBE_API_KEY` を実際のキーに置き換える。

> **APIキー無しでも動かしたい場合**: 取得処理が失敗するとフォールバックBGM (Lofi Girl の 24/7 ストリーム) で再生を継続するため、開発時はキー無しでも UI 動作確認できます。

### 4. 開発サーバ起動

```bash
npm run dev
```

→ http://localhost:5173

### 5. ビルド

```bash
npm run build
npm run preview
```

## デプロイ (Vercel)

```bash
vercel
```

または GitHub と連携してプッシュ自動デプロイ。

**Vercel ダッシュボード** → Project Settings → Environment Variables で
`YOUTUBE_API_KEY` を登録してください（`.env` はデプロイされません）。

## ファイル構成

```
src/
├── app.html                            # HTMLシェル
├── app.css                             # グローバルCSS変数とリセット
├── lib/components/
│   ├── Timer.svelte                    # タイマー（自己完結、イベント発火）
│   └── BgmPlayer.svelte                # YouTubeプレイヤーラッパー
└── routes/
    ├── +layout.svelte                  # 全ページ共通レイアウト
    ├── +page.svelte                    # メインページ（オーケストレーション）
    └── api/youtube/+server.js          # YouTube検索エンドポイント
```

## 設計上のポイント

### 1. APIキーはサーバーサイドにのみ存在

`$env/static/private` から読み込むため、クライアントバンドルには含まれません。
フロントは `/api/youtube?category=lofi&minutes=25` を叩くだけ。

### 2. タイマー時間 vs 動画長さのフォールバック

YouTube Data API は exact-duration フィルタを持たないので、`videoDuration=long`
(20分超) で長めの動画を取り、タイマー終了時に IFrame Player API の `stopVideo()`
で停止させる戦略です（仕様書 1.2 のフォールバック処理に対応）。

### 3. レート制限ハンドリング

API が `403` を返した場合（クォータ超過 / キー無効）、エラーで止めず
固定の Lofi BGM (`jfKfPfyJRdk`) にフォールバックします。レスポンスに
`source: 'fallback'` が立つので UI で軽く明示しています。

### 4. スキップ時の重複回避

直近5件の Video ID をクライアント側でメモして `skip` パラメータで送信、
サーバ側で除外フィルタしているので「同じ動画ばかり来る」を回避します。

## 拡張ポイント（仕様書 1.2 / 将来）

- **Supabase 連携**: お気に入りBGM履歴 / カスタムプリセット保存
- **ポモドーロのセッション管理**: 4セットごとに長休憩を自動挿入
- **動画の長さ厳密マッチ**: `videos.list?part=contentDetails` で ISO8601 duration を取得し
  タイマー秒数との差が小さいものを優先する二段階検索
