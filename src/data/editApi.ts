import type { Trip, TripSummary } from "../types/trip";

// ローカル開発サーバー（vite.config.tsのlocalEditApiPlugin）は相対パスをそのまま使う。
// 本番（GitHub Pages）ではCloudflare Worker（GitHub経由で保存する）を叩く。
const isDev = import.meta.env.DEV;
const WORKER_URL = "https://travel-journal-editor.sagarrr38.workers.dev";
const PASSWORD_STORAGE_KEY = "travel-log-password";

function apiUrl(path: string): string {
  return isDev ? path : `${WORKER_URL}${path}`;
}

// Workerでの認証用パスワードは、絵文字等の非ASCII文字を含みうるためHTTPヘッダーでは送れない
// （Fetch APIのヘッダー値はByteString制約があり非ASCII文字を許容しない）。クエリパラメータで送る。
function withPassword(url: string): string {
  if (isDev) return url;
  const password = localStorage.getItem(PASSWORD_STORAGE_KEY) ?? "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}password=${encodeURIComponent(password)}`;
}

export interface NewTripInput {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  regions: string[];
}

export async function createTrip(input: NewTripInput): Promise<{ trip: Trip; summary: TripSummary }> {
  const res = await fetch(withPassword(apiUrl("/api/trips-new")), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`作成に失敗しました（${res.status}）: ${await res.text()}`);
  }
  return res.json();
}

export async function saveTrip(trip: Trip): Promise<void> {
  const res = await fetch(withPassword(apiUrl(`/api/trips/${trip.id}`)), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });
  if (!res.ok) {
    throw new Error(`保存に失敗しました（${res.status}）`);
  }
}

export async function uploadPhoto(tripId: string, file: File): Promise<string> {
  const res = await fetch(withPassword(apiUrl(`/api/photos/${tripId}?filename=${encodeURIComponent(file.name)}`)), {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`アップロードに失敗しました（${res.status}）`);
  }
  const data = (await res.json()) as { path: string };
  return data.path;
}
