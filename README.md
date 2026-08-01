# 旅ノート（Travel Journal）

複数の旅行を「しおり（旅行前）」「アルバム（旅行後）」として一元管理する、個人用の旅行記録Webアプリです。
React + Vite + TypeScript + Leaflet で構築し、GitHub Pagesで無料公開する前提の構成になっています。

## 開発

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド（GitHub Pagesにはこのdist/を公開）
npm run preview  # ビルド結果をローカルで確認
```

## 新しい旅行を追加する方法

### 方法1（推奨）：このチャットでClaude Codeに伝える

旅程（日付・時間・場所・カテゴリ・住所・メモなど）や写真を、このチャットでそのまま伝えてください。
Claude Codeが内容を解析し、以下を自動で行います。

1. `src/data/trips/<tripId>.json` の作成・更新
2. `src/data/trips-index.json` への一覧用サマリ追加
3. `public/photos/<tripId>/` への写真配置（受け取った写真がある場合）

JSONを直接編集する必要はありません。Excelファイルを渡してもらっても構いません（下記の方法2でも取り込めます）。

### 方法2：Excel(.xlsx)から取り込む

既にExcelで旅程を管理している場合は、下記のシート構成で用意すれば自動変換できます。

- `info`シート：A列にキー（`name`, `startDate`, `endDate`, `regions`, `coverPhoto`, `memo`）、B列に値
- `schedule`シート：ヘッダー行 `date,time,name,category,address,lat,lng,googleMapsUrl,officialUrl,photos,memo`

```bash
npm run import:excel -- ./schedule.xlsx hokkaido2026
```

実行後、`src/data/trips-index.json` に一覧用サマリを手動または依頼して追記してください。

## データ構造

```
src/data/
├── trips-index.json      # トップページ（カード/カレンダー/地図）用の軽量サマリ一覧
└── trips/
    └── <tripId>.json     # 旅行ごとの詳細（概要＋スケジュール配列）

public/photos/<tripId>/   # 実際の写真ファイル
```

`trips/*.json` は追加するだけで自動的にアプリへ反映されます（コード側の変更は不要）。

## GitHub Pagesへの公開

`main`ブランチにpushすると `.github/workflows/deploy.yml` が自動でビルド・公開します。
リポジトリの Settings > Pages で Source を「GitHub Actions」に設定してください。
