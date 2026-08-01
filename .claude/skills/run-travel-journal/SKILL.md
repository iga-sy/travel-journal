---
name: run-travel-journal
description: Travel Log（旅行記録）Webアプリの開発サーバーを起動し、パスワードゲートを突破してブラウザで実際の画面（トップページのカード・詳細ページの旅程/アルバム/地図）をスクリーンショット確認する。「アプリを起動して確認して」「表示を確認して」「動作確認して」等のときに使う。import-tripスキルの手順7（反映・確認）から呼ばれることが多い。
---

# Travel Log アプリの起動と動作確認

このプロジェクトはヘッドレス環境で動くため、ブラウザウィンドウは開けない。Playwrightで headless Chromium を操作し、スクリーンショットで実際のレンダリングを確認する。`chromium-cli`はこの環境には入っていないので使わない。

## 1. 開発サーバーを起動

```bash
cd "旅行記録"
npm run dev &   # predevでscripts/encrypt-data.mjsが自動実行される（.env.localのSITE_PASSWORD必須）
```

ポートは`5173`固定（Vite）。起動確認は`curl -s -o /dev/null -w "%{http_code}" http://localhost:5173`が`200`を返すまで待つ（sleepではなくポーリング）。

止めるときはポートのリスナーをkillする（npmラッパー経由だと`$!`だけでは止まらない）。

## 2. Playwrightの用意（プロジェクトに常設していない）

このプロジェクトの`devDependencies`にPlaywrightは入っていない。`npx playwright`は「依存関係を先にnpm installしろ」という警告だけ出して素通りすることがあり、また**スクレイパースクリプトをscratchpadディレクトリに置くとnode_modules解決に失敗する**（scratchpadはこのプロジェクトのnode_modulesの外だから）。確実な手順：

```bash
cd "旅行記録"
npm install --no-save playwright   # package.json/lockを汚さず一時導入
node _tmp_verify.mjs               # プロジェクト直下に一時スクリプトを置いて実行
npm uninstall playwright           # 確認が終わったら必ず後片付け
rm _tmp_verify.mjs
```

ブラウザ本体（chromium-1234等）は`~/AppData/Local/ms-playwright`に既にキャッシュされていることが多く、`npx playwright install chromium`は警告を出すだけですぐ終わる（インストール済みなら再ダウンロードはしない）。

## 3. 認証（パスワードゲート）

`.env.local`の`SITE_PASSWORD`の値を使う。フォームは`input[type="password"]`に`fill`して`button[type="submit"]`を`click`。成功するとPasswordGateが外れてTopPageが描画される。

```js
await page.goto('http://localhost:5173/');
await page.waitForSelector('input[type="password"]');
await page.fill('input[type="password"]', /* .env.localのSITE_PASSWORD */);
await page.click('button[type="submit"]');
await page.waitForSelector('text=旅の記録', { timeout: 10000 });
```

## 4. 代表的な確認フロー

`HashRouter`なので旅行詳細ページには`http://localhost:5173/#/trips/<tripId>`で直接遷移できる（トップページのカードをクリックする必要はない）。

```js
await page.goto('http://localhost:5173/#/trips/nasu2025');
await page.waitForSelector('text=那須旅行 2025', { timeout: 10000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'detail.png', fullPage: true });
```

- 旅程・アルバムは`fullPage`スクリーンショットで一度に確認できる
- **地図（Leaflet）はタイル読み込みに数秒かかる**。ページ遷移直後にスクリーンショットを撮るとグレーの背景にマーカーだけ浮いた状態になる。`.leaflet-container`要素を`waitForTimeout(2000〜3000)`してから個別に`.screenshot()`すると、タイルが読み込まれた状態を撮れる
- コンソールエラーは`page.on('console', ...)`で`type()==='error'`を集め、最後に空配列であることを確認する（データ取得やデコードの失敗は画面が真っ白にならず静かに落ちることがある）

## 参考
- 那須旅行2025-2026データの確認作業がこの手順の実例（2026-08-01実施、import-tripスキルから連動）
