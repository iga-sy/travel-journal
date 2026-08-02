export interface Env {
  GITHUB_TOKEN: string;
  SITE_PASSWORD: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  ALLOWED_ORIGIN: string;
}

interface TripComment {
  id: string;
  author: string;
  text: string;
}

interface AlbumOnlyPhoto {
  path: string;
  date: string;
  time?: string;
}

interface TripLike {
  comments?: TripComment[];
  photos?: AlbumOnlyPhoto[];
  [key: string]: unknown;
}

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

function checkPassword(env: Env, password: string) {
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

async function getTripFile(env: Env, tripId: string): Promise<{ trip: TripLike; sha: string }> {
  const res = await githubApi(env, `/contents/src/data/trips/${tripId}.json?ref=${env.GITHUB_BRANCH}`);
  if (!res.ok) throw new Error(`旅行データが見つかりません (${res.status})`);
  const data = (await res.json()) as { content: string; sha: string };
  const text = new TextDecoder("utf-8").decode(base64ToBytes(data.content));
  return { trip: JSON.parse(text) as TripLike, sha: data.sha };
}

// GitHub Contents APIはコミット直前のshaが一致しないと409を返す。
// 複数端末からほぼ同時に更新されるケースを想定し、1回だけ取り直して再試行する。
async function updateTripFile(
  env: Env,
  tripId: string,
  mutate: (trip: TripLike) => void,
  message: string,
): Promise<TripLike> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { trip, sha } = await getTripFile(env, tripId);
    mutate(trip);
    const text = JSON.stringify(trip, null, 2) + "\n";
    const content = bytesToBase64(new TextEncoder().encode(text));
    const res = await githubApi(env, `/contents/src/data/trips/${tripId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, content, sha, branch: env.GITHUB_BRANCH }),
    });
    if (res.ok) return trip;
    if (res.status === 409 && attempt === 0) continue;
    throw new Error(`保存に失敗しました (${res.status}): ${await res.text()}`);
  }
  throw new Error("保存に失敗しました（競合が解消できませんでした）");
}

async function putPhotoFile(env: Env, tripId: string, filename: string, bytes: Uint8Array, message: string) {
  const content = bytesToBase64(bytes);
  const path = `assets-source/photos/${tripId}/${filename}`;
  const res = await githubApi(env, `/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, content, branch: env.GITHUB_BRANCH }),
  });
  if (!res.ok) throw new Error(`写真のアップロードに失敗しました (${res.status}): ${await res.text()}`);
  return `photos/${tripId}/${filename}`;
}

async function handleAddComment(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { tripId: string; password: string; author: string; text: string };
  checkPassword(env, body.password);
  const text = body.text?.trim();
  if (!text) throw new Error("text required");
  const author = body.author?.trim() || "名無し";

  const trip = await updateTripFile(
    env,
    body.tripId,
    (t) => {
      t.comments = [...(t.comments ?? []), { id: crypto.randomUUID(), author, text }];
    },
    `chat: ${author}のメモを追加`,
  );
  return jsonResponse(env, { ok: true, comments: trip.comments });
}

async function handleRemoveComment(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { tripId: string; password: string; commentId: string };
  checkPassword(env, body.password);

  const trip = await updateTripFile(
    env,
    body.tripId,
    (t) => {
      t.comments = (t.comments ?? []).filter((c) => c.id !== body.commentId);
    },
    "chat: メモを削除",
  );
  return jsonResponse(env, { ok: true, comments: trip.comments });
}

async function handleUploadPhoto(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const password = url.searchParams.get("password") ?? "";
  checkPassword(env, password);

  const tripId = url.searchParams.get("tripId");
  const filename = url.searchParams.get("filename");
  const date = url.searchParams.get("date");
  const time = url.searchParams.get("time") ?? "";
  if (!tripId || !filename || !date) throw new Error("tripId, filename, date are required");

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalName = `upload-${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error("empty file");

  const path = await putPhotoFile(env, tripId, finalName, bytes, `chat: 写真を追加 (${finalName})`);

  await updateTripFile(
    env,
    tripId,
    (t) => {
      t.photos = [...(t.photos ?? []), { path, date, time }];
    },
    `chat: ${finalName} をアルバムに追加`,
  );

  return jsonResponse(env, { ok: true, path });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    try {
      if (request.method === "POST" && url.pathname === "/comments/add") {
        return await handleAddComment(request, env);
      }
      if (request.method === "POST" && url.pathname === "/comments/remove") {
        return await handleRemoveComment(request, env);
      }
      if (request.method === "POST" && url.pathname === "/photos") {
        return await handleUploadPhoto(request, env);
      }
      return jsonResponse(env, { error: "not found" }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message === "unauthorized" ? 401 : 500;
      return jsonResponse(env, { error: message }, status);
    }
  },
};
