import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { webcrypto as crypto } from "node:crypto";

const ITERATIONS = 600_000;

async function loadEnvLocal() {
  try {
    const text = await readFile(".env.local", "utf-8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local が無ければ環境変数（CI等）のみを使う
  }
}

async function deriveKey(password, salt) {
  const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
}

async function encryptBytes(key, plainBytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plainBytes);
  return Buffer.concat([Buffer.from(iv), Buffer.from(ciphertext)]);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (!entry.name.startsWith("_") && !entry.name.startsWith(".")) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  await loadEnvLocal();
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    console.error(
      "エラー: SITE_PASSWORD が設定されていません。ローカルでは .env.local に SITE_PASSWORD=... を書くか、CI では repository secret を設定してください。",
    );
    process.exit(1);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);

  await rm("public/data.enc", { force: true });
  await rm("public/enc-meta.json", { force: true });
  await rm("public/photos-enc", { recursive: true, force: true });
  await mkdir("public", { recursive: true });

  // 旅程データ（trips-index.json + trips/*.json）をまとめて暗号化
  const tripsIndex = JSON.parse(await readFile("src/data/trips-index.json", "utf-8"));
  const tripFiles = (await readdir("src/data/trips")).filter((f) => f.endsWith(".json"));
  const trips = {};
  for (const file of tripFiles) {
    const trip = JSON.parse(await readFile(path.join("src/data/trips", file), "utf-8"));
    trips[trip.id] = trip;
  }
  const payload = JSON.stringify({ tripsIndex, trips });
  const encryptedData = await encryptBytes(key, new TextEncoder().encode(payload));
  await writeFile("public/data.enc", encryptedData);

  // 写真を再帰的に暗号化（assets-source/photos/** -> public/photos-enc/**.enc）
  const photosRoot = "assets-source/photos";
  let photoCount = 0;
  try {
    const files = await walk(photosRoot);
    for (const file of files) {
      const rel = path.relative(photosRoot, file);
      const outPath = path.join("public/photos-enc", `${rel}.enc`);
      await mkdir(path.dirname(outPath), { recursive: true });
      const bytes = await readFile(file);
      const encrypted = await encryptBytes(key, bytes);
      await writeFile(outPath, encrypted);
      photoCount++;
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }

  await writeFile(
    "public/enc-meta.json",
    JSON.stringify({ salt: Buffer.from(salt).toString("base64"), iterations: ITERATIONS }),
  );

  console.log(`暗号化完了: 旅行データ ${tripFiles.length}件, 写真 ${photoCount}枚`);
}

main();
