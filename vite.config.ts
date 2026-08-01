import { readFile, writeFile } from "node:fs/promises";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { loadEnvLocal, encryptTripsData } from "./scripts/encrypt-data.mjs";

function readRequestBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

// npm run dev のときだけ有効なローカル専用の編集API。
// vite build / vite preview には含まれないため、公開サイトには一切存在しない。
function localEditApiPlugin(): Plugin {
  return {
    name: "local-edit-api",
    configureServer(server) {
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
    },
  };
}

// GitHub Pages ではリポジトリ名によってパスが変わるため、相対パス基準でビルドする。
export default defineConfig({
  base: "./",
  plugins: [react(), localEditApiPlugin()],
});
