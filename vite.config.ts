import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { loadEnvLocal, encryptTripsData, encryptPhotos } from "./scripts/encrypt-data.mjs";

function readRequestBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function readRequestBodyBuffer(req: import("node:http").IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// npm run dev のときだけ有効なローカル専用の編集API。
// vite build / vite preview には含まれないため、公開サイトには一切存在しない。
const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 };

function localEditApiPlugin(): Plugin {
  return {
    name: "local-edit-api",
    configureServer(server) {
      server.middlewares.use("/api/trips-new", async (req, res, next) => {
        if (req.method !== "POST") return next();

        try {
          const body = await readRequestBody(req);
          const input = JSON.parse(body) as {
            id: string;
            name: string;
            startDate: string;
            endDate: string;
            regions: string[];
          };
          const { id, name, startDate, endDate, regions } = input;
          if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            res.statusCode = 400;
            res.end("invalid trip id");
            return;
          }
          if (!name || !startDate || !endDate) {
            res.statusCode = 400;
            res.end("name, startDate, endDate are required");
            return;
          }

          const tripPath = `src/data/trips/${id}.json`;
          try {
            await readFile(tripPath, "utf-8");
            res.statusCode = 409;
            res.end("この旅行IDは既に使われています");
            return;
          } catch {
            // 既存ファイルが無ければ新規作成へ進む
          }

          const trip = {
            id,
            name,
            startDate,
            endDate,
            regions: regions ?? [],
            coverPhoto: "",
            schedule: [],
          };
          await writeFile(tripPath, JSON.stringify(trip, null, 2) + "\n", "utf-8");

          const indexPath = "src/data/trips-index.json";
          const tripsIndex = JSON.parse(await readFile(indexPath, "utf-8"));
          const summary = {
            id,
            name,
            startDate,
            endDate,
            regions: regions ?? [],
            coverPhoto: "",
            photoCount: 0,
            location: JAPAN_CENTER,
          };
          tripsIndex.push(summary);
          await writeFile(indexPath, JSON.stringify(tripsIndex, null, 2) + "\n", "utf-8");

          await loadEnvLocal();
          const password = process.env.SITE_PASSWORD;
          if (!password) throw new Error("SITE_PASSWORD not set");
          await encryptTripsData(password);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, trip, summary }));
        } catch (err) {
          res.statusCode = 500;
          res.end(String(err));
        }
      });

      server.middlewares.use("/api/trips", async (req, res, next) => {
        if (req.method !== "POST" || !req.url) return next();

        const id = req.url.replace(/^\/+/, "").split("?")[0];
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
          res.statusCode = 400;
          res.end("invalid trip id");
          return;
        }

        try {
          const body = await readRequestBody(req);
          const trip = JSON.parse(body);

          await writeFile(`src/data/trips/${id}.json`, JSON.stringify(trip, null, 2) + "\n", "utf-8");

          // カバー写真が変わっていたら一覧用サマリも合わせて更新する
          const indexPath = "src/data/trips-index.json";
          const tripsIndex = JSON.parse(await readFile(indexPath, "utf-8"));
          const entry = tripsIndex.find((t: { id: string }) => t.id === id);
          if (entry && entry.coverPhoto !== trip.coverPhoto) {
            entry.coverPhoto = trip.coverPhoto;
            await writeFile(indexPath, JSON.stringify(tripsIndex, null, 2) + "\n", "utf-8");
          }

          await loadEnvLocal();
          const password = process.env.SITE_PASSWORD;
          if (!password) throw new Error("SITE_PASSWORD not set");
          await encryptTripsData(password);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.statusCode = 500;
          res.end(String(err));
        }
      });

      // 画面からアルバムに新しい写真をアップロードするための、ローカル専用エンドポイント。
      // assets-source/photos/<tripId>/ に原本を書き込み、写真の暗号化キャッシュを作り直す。
      server.middlewares.use("/api/photos", async (req, res, next) => {
        if (req.method !== "POST" || !req.url) return next();

        const [idPart, query] = req.url.replace(/^\/+/, "").split("?");
        const id = idPart;
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
          res.statusCode = 400;
          res.end("invalid trip id");
          return;
        }
        const params = new URLSearchParams(query ?? "");
        const rawFilename = params.get("filename") ?? "";
        const safeName = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, "_");
        if (!safeName) {
          res.statusCode = 400;
          res.end("invalid filename");
          return;
        }

        try {
          const buf = await readRequestBodyBuffer(req);
          const dir = `assets-source/photos/${id}`;
          await mkdir(dir, { recursive: true });
          const finalName = `upload-${Date.now()}-${safeName}`;
          await writeFile(path.join(dir, finalName), buf);

          await loadEnvLocal();
          const password = process.env.SITE_PASSWORD;
          if (!password) throw new Error("SITE_PASSWORD not set");
          await encryptPhotos(password);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, path: `photos/${id}/${finalName}` }));
        } catch (err) {
          res.statusCode = 500;
          res.end(String(err));
        }
      });
    },
  };
}

// GitHub Pages ではリポジトリ名によってパスが変わるため、相対パス基準でビルドする。
export default defineConfig({
  base: "./",
  plugins: [react(), localEditApiPlugin()],
});
