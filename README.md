# 旅ノート（Travel Journal）

複数の旅行を「しおり（旅行前）」「アルバム（旅行後）」として一元管理する、個人用の旅行記録Webアプリです。
React + Vite + TypeScript + Leaflet で構築し、GitHub Pagesで無料公開する前提の構成になっています。

## ⚠️ このリポジトリは必ずPrivateにすること

旅行データ（`src/data/trips*`）と写真原本（`assets-source/photos/`）は、Gitリポジトリの中には**平文のまま**入っています（暗号化されるのはビルド後にGitHub Pagesへ公開される成果物だけ）。リポジトリをPublicにすると、写真や旅程がリポジトリ画面からそのまま見えてしまい、下記の暗号化の意味がなくなります。個人アカウントのPrivateリポジトリは無料枠内で作成できます。

## 開発

初回のみ、`.env.local` に以下を作成してください（Gitにはコミットされません）。

```
SITE_PASSWORD=サイトの閲覧パスワード
```

```bash
npm install
npm run dev      # 開発サーバー起動（起動前に自動でデータ・写真を暗号化）
npm run build    # 本番ビルド（GitHub Pagesにはこのdist/を公開）
npm run preview  # ビルド結果をローカルで確認
```

## 新しい旅行を追加する方法

### 方法1（推奨）：このチャットでClaude Codeに伝える

旅程（日付・時間・場所・カテゴリ・住所・メモなど）や写真を、このチャットでそのまま伝えてください。
Claude Codeが内容を解析し、以下を自動で行います。

1. `src/data/trips/<tripId>.json` の作成・更新
2. `src/data/trips-index.json` への一覧用サマリ追加
3. `assets-source/photos/<tripId>/` への写真配置（HEIC等はJPEGに変換し、Exifの日時から時刻を推定）

JSONを直接編集する必要はありません。Excelファイルを渡してもらっても構いません（下記の方法2でも取り込めます）。

### 方法2：Excel(.xlsx)から取り込む

既にExcelで旅程を管理している場合は、下記のシート構成で用意すれば自動変換できます。

- `info`シート：A列にキー（`name`, `startDate`, `endDate`, `regions`, `coverPhoto`, `memo`）、B列に値
- `schedule`シート：ヘッダー行 `date,time,name,category,address,lat,lng,googleMapsUrl,officialUrl,photos,memo`

```bash
npm run import:excel -- ./schedule.xlsx <tripId>
```

実行後、`src/data/trips-index.json` に一覧用サマリを手動または依頼して追記してください。

## データ構造

```
src/data/
├── trips-index.json           # トップページ（カード/カレンダー/地図）用の軽量サマリ一覧
└── trips/
    └── <tripId>.json          # 旅行ごとの詳細（概要＋スケジュール＋一般アルバム写真）

assets-source/photos/<tripId>/ # 写真原本（暗号化前。Gitには平文のまま入る＝リポジトリは必ずPrivate）
```

`trips/*.json` は追加するだけで自動的にアプリへ反映されます（コード側の変更は不要）。

## サイトの暗号化・パスワード保護

`npm run dev` / `npm run build` の前に、`scripts/encrypt-data.mjs` が自動的に実行されます。このスクリプトが行うこと：

1. `SITE_PASSWORD` からPBKDF2（60万回）で鍵を導出
2. 旅行データ（`trips-index.json` + `trips/*.json`）をAES-GCMで暗号化 → `public/data.enc`
3. `assets-source/photos/` 配下の写真を1枚ずつAES-GCMで暗号化 → `public/photos-enc/**.enc`
4. 鍵導出に使うsalt・iterations（秘密情報ではない）を `public/enc-meta.json` に出力

`public/data.enc` / `public/photos-enc/` / `public/enc-meta.json` はビルド成果物なのでGitにはコミットしません（`.gitignore`済み）。

サイトを開くとパスワード入力画面が表示され、入力されたパスワードでその場で復号を試みます。**パスワードが正しいかどうかは判定していません**。AES-GCMの認証タグが一致すれば復号成功＝正しいパスワード、一致しなければ復号が失敗し「パスワードが違います」と表示されます。正しいパスワードを知らない人には、旅行データも写真も一切読めません。

復号済みの内容はブラウザのメモリ（Reactの状態）にのみ保持され、`localStorage`等には残しません。ページをリロードしたりタブを閉じたりすると、再度パスワード入力が必要になります。

### パスワードを変更する

1. `.env.local` の `SITE_PASSWORD` を書き換える
2. GitHub Actionsでデプロイしている場合は、リポジトリの Settings > Secrets and variables > Actions で `SITE_PASSWORD` を同じ値に更新する

## GitHub Pagesへの公開

1. リポジトリを**Private**で作成する
2. リポジトリの Settings > Secrets and variables > Actions で `SITE_PASSWORD`（`.env.local`と同じ値）を登録する
3. リポジトリの Settings > Pages で Source を「GitHub Actions」に設定する
4. `main`ブランチにpushすると `.github/workflows/deploy.yml` が自動でビルド・公開する
