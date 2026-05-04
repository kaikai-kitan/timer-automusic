# デプロイ手順（最短版）

このフォルダの中で以下を順番に実行するだけです。

## 1. ターミナルをこのフォルダで開く

解凍したフォルダ（`package.json` などが見える階層）でターミナルを開く。

Mac の場合: Finder でフォルダを右クリック →「フォルダに新規ターミナル」

## 2. Git の初期化と push

下のコマンドの `<URL>` を、自分の GitHub リポジトリの URL（`https://github.com/kaikai-kitan/xxxx.git` のような形式）に置き換えて、まとめて実行：

```bash
git init
git add .
git commit -m "Deploy timer-bgm app"
git branch -M main
git remote add origin <URL>
git push -u origin main --force
```

## 3. Vercel が自動でデプロイ

push されると Vercel が自動でビルド＆デプロイします。
**Deployments** タブで進捗が見えます。

## 4. 環境変数の設定（忘れずに）

Vercel → Project → **Settings** → **Environment Variables** で以下を追加：

- Name: `YOUTUBE_API_KEY`
- Value: 取得した YouTube Data API のキー
- Environment: 全部にチェック（Production / Preview / Development）

設定後、**Deployments** タブから最新デプロイの「…」→ **Redeploy** で再ビルド。

## 5. 完了

`https://<プロジェクト名>.vercel.app` にアクセスして動作確認！

---

## トラブル対応

### 「Permission denied (publickey)」のような認証エラー

GitHub の認証ができていません。HTTPS の URL を使っているか確認してください
（`https://github.com/...` の形式。`git@github.com:...` ではなく）。

HTTPS で push するときに Username と Password を聞かれますが、Password 欄には
**Personal Access Token** を入力する必要があります。
- GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token (classic) で `repo` スコープにチェック → 作成
- 表示されたトークンをコピーして Password に貼り付け

### Vercel のビルドログでエラーが出る

Project の Settings で：
- **Framework Preset** が `SvelteKit` になっているか
- **Root Directory** が空欄（デフォルト）になっているか

を確認してください。
