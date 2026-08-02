export interface Env {
  GITHUB_TOKEN: string;
  SITE_PASSWORD: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  ALLOWED_ORIGIN: string;
}

const JAPAN_CENTER = { lat: 36.2048, lng: 138.2529 };

function corsHeaders(env: Env): HeadersInit {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(env: Env, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

// パスワードは絵文字等の非ASCII文字を含みうるため、HTTPヘッダー（ByteString制約）ではなく
// クエリパラメータ（URLエンコード済み）で受け取る。
function checkPassword(env: Env, url: URL) {
  const password = url.searchParams.get("password") ?? "";
  if (!password || password !== env.SITE_PASSWORD) {
    throw new Error("unauthorized");
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function githubApi(env: Env, path: string, init?: RequestInit): Promise<Response> {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "travel-journal-worker",
      Accept: "application/vnd.github+json",
      ...(init?.headers ?? {}),
    },
  });
}

async function getFile(env: Env, path: string): Promise<{ text: string; sha: string } | null> {
  const res = await githubApi(env, `/contents/${path}?ref=${env.GITHUB_BRANCH}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHubからの取得に失敗しました (${res.status})`);
  const data = (await res.json()) as { content: string; sha: string };
  const text = new TextDecoder("utf-8").decode(base64ToBytes(data.content));
  return { text, sha: data.sha };
}

async function putFile(
  env: Env,
  path: string,
  content: string | Uint8Array,
  message: string,
  sha?: string,
): Promise<void> {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
  const res = await githubApi(env, `/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: bytesToBase64(bytes), branch: env.GITHUB_BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`GitHubへの保存に失敗しました (${res.status}): ${await res.text()}`);
}

interface TripSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  regions: string[];
  coverPhoto: string;
  photoCount: number;
  comment?: string;
  location: { lat: number; lng: number };
}

interface TripLike {
  id: string;
  coverPhoto: string;
  [key: string]: unknown;
}

async function handleCreateTrip(request: Request, env: Env, url: URL): Promise<Response> {
  checkPassword(env, url);
  const input = (await request.json()) as {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    regions: string[];
  };
  const { id, name, startDate, endDate, regions } = input;
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("invalid trip id");
  if (!name || !startDate || !endDate) throw new Error("name, startDate, endDate are required");

  const tripPath = `src/data/trips/${id}.json`;
  const existing = await getFile(env, tripPath);
  if (existing) throw new Error("この旅行IDは既に使われています");

  const trip: TripLike = { id, name, startDate, endDate, regions: regions ?? [], coverPhoto: "", schedule: [] };
  await putFile(env, tripPath, JSON.stringify(trip, null, 2) + "\n", `chat: ${name} を新規作成`);

  const indexPath = "src/data/trips-index.json";
  const indexFile = await getFile(env, indexPath);
  if (!indexFile) throw new Error("trips-index.jsonが見つかりません");
  const tripsIndex = JSON.parse(indexFile.text) as TripSummary[];
  const summary: TripSummary = {
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
  await putFile(env, indexPath, JSON.stringify(tripsIndex, null, 2) + "\n", `chat: ${name} を一覧に追加`, indexFile.sha);

  return jsonResponse(env, { ok: true, trip, summary });
}

async function handleSaveTrip(request: Request, env: Env, url: URL, tripId: string): Promise<Response> {
  checkPassword(env, url);
  const trip = (await request.json()) as TripLike;

  const tripPath = `src/data/trips/${tripId}.json`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await getFile(env, tripPath);
    if (!current) throw new Error("旅行データが見つかりません");
    const res = await githubApi(env, `/contents/${tripPath}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `chat: ${tripId} を更新`,
        content: bytesToBase64(new TextEncoder().encode(JSON.stringify(trip, null, 2) + "\n")),
        branch: env.GITHUB_BRANCH,
        sha: current.sha,
      }),
    });
    if (res.ok) break;
    if (res.status === 409 && attempt === 0) continue;
    throw new Error(`保存に失敗しました (${res.status}): ${await res.text()}`);
  }

  // カバー写真が変わっていたら一覧用サマリも合わせて更新する
  const indexPath = "src/data/trips-index.json";
  const indexFile = await getFile(env, indexPath);
  if (indexFile) {
    const tripsIndex = JSON.parse(indexFile.text) as TripSummary[];
    const entry = tripsIndex.find((t) => t.id === tripId);
    if (entry && entry.coverPhoto !== trip.coverPhoto) {
      entry.coverPhoto = trip.coverPhoto as string;
      await putFile(env, indexPath, JSON.stringify(tripsIndex, null, 2) + "\n", `chat: ${tripId} のカバー写真を更新`, indexFile.sha);
    }
  }

  return jsonResponse(env, { ok: true });
}

async function handleUploadPhoto(request: Request, env: Env, url: URL, tripId: string): Promise<Response> {
  checkPassword(env, url);
  const rawFilename = url.searchParams.get("filename") ?? "";
  const safeName = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!safeName) throw new Error("invalid filename");

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error("empty file");

  const finalName = `upload-${Date.now()}-${safeName}`;
  const path = `assets-source/photos/${tripId}/${finalName}`;
  await putFile(env, path, bytes, `chat: 写真を追加 (${finalName})`);

  return jsonResponse(env, { ok: true, path: `photos/${tripId}/${finalName}` });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    try {
      if (request.method === "POST" && url.pathname === "/api/trips-new") {
        return await handleCreateTrip(request, env, url);
      }
      const tripMatch = url.pathname.match(/^\/api\/trips\/([a-zA-Z0-9_-]+)$/);
      if (request.method === "POST" && tripMatch) {
        return await handleSaveTrip(request, env, url, tripMatch[1]);
      }
      const photoMatch = url.pathname.match(/^\/api\/photos\/([a-zA-Z0-9_-]+)$/);
      if (request.method === "POST" && photoMatch) {
        return await handleUploadPhoto(request, env, url, photoMatch[1]);
      }
      return jsonResponse(env, { error: "not found" }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message === "unauthorized" ? 401 : 500;
      return jsonResponse(env, { error: message }, status);
    }
  },
};
