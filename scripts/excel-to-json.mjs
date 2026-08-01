// Excel(.xlsx)から旅行データを取り込む任意スクリプト。
// 主運用はチャットでClaude Codeに旅程を伝えてJSONを直接生成してもらう方式だが、
// 既にExcelで旅程を管理している場合はこちらを使ってもよい。
//
// 使い方: npm run import:excel -- <schedule.xlsxのパス> <tripId>
//
// Excelの想定シート構成:
//   - "info"     : キー(A列) / 値(B列) の2列。 name, startDate, endDate, regions, coverPhoto, memo
//                  regionsはカンマ区切り（例: 札幌,小樽）
//   - "schedule" : ヘッダー行 date,time,name,category,address,lat,lng,googleMapsUrl,officialUrl,photos,memo
//                  photosはカンマ区切りのファイル名（public/photos/<tripId>/ 配下を想定）

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const [, , xlsxPathArg, tripIdArg] = process.argv;

if (!xlsxPathArg || !tripIdArg) {
  console.error("使い方: npm run import:excel -- <schedule.xlsxのパス> <tripId>");
  process.exit(1);
}

const xlsxPath = path.resolve(xlsxPathArg);
const tripId = tripIdArg;

if (!existsSync(xlsxPath)) {
  console.error(`ファイルが見つかりません: ${xlsxPath}`);
  process.exit(1);
}

const workbook = XLSX.readFile(xlsxPath);

function readInfoSheet() {
  const sheet = workbook.Sheets["info"];
  if (!sheet) return {};
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const info = {};
  for (const [key, value] of rows) {
    if (!key) continue;
    info[String(key).trim()] = value;
  }
  return info;
}

function readScheduleSheet() {
  const sheetName = workbook.SheetNames.includes("schedule") ? "schedule" : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .filter((row) => row.date && row.name)
    .map((row) => {
      const item = {
        date: String(row.date),
        time: String(row.time ?? ""),
        name: String(row.name),
        category: String(row.category ?? "観光"),
      };
      if (row.address) item.address = String(row.address);
      if (row.lat && row.lng) {
        item.location = { lat: Number(row.lat), lng: Number(row.lng) };
      }
      if (row.googleMapsUrl) item.googleMapsUrl = String(row.googleMapsUrl);
      if (row.officialUrl) item.officialUrl = String(row.officialUrl);
      if (row.photos) {
        item.photos = String(row.photos)
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `photos/${tripId}/${p}`);
      }
      if (row.memo) item.memo = String(row.memo);
      return item;
    });
}

const info = readInfoSheet();
const schedule = readScheduleSheet();

const trip = {
  id: tripId,
  name: info.name ?? tripId,
  startDate: info.startDate ?? schedule[0]?.date ?? "",
  endDate: info.endDate ?? schedule[schedule.length - 1]?.date ?? "",
  regions: info.regions ? String(info.regions).split(",").map((r) => r.trim()) : [],
  coverPhoto: info.coverPhoto ?? `photos/${tripId}/cover.jpg`,
  memo: info.memo ?? "",
  schedule,
};

const tripsDir = path.join(projectRoot, "src", "data", "trips");
mkdirSync(tripsDir, { recursive: true });
const outPath = path.join(tripsDir, `${tripId}.json`);
writeFileSync(outPath, JSON.stringify(trip, null, 2) + "\n", "utf-8");

console.log(`書き出しました: ${outPath}`);
console.log(
  "注意: src/data/trips-index.json にこの旅行のサマリ（一覧用）を追記してください。詳細はREADMEを参照。",
);
