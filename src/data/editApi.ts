import type { Trip, TripSummary } from "../types/trip";

export interface NewTripInput {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  regions: string[];
}

export async function createTrip(input: NewTripInput): Promise<{ trip: Trip; summary: TripSummary }> {
  const res = await fetch("/api/trips-new", {
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
  const res = await fetch(`/api/trips/${trip.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });
  if (!res.ok) {
    throw new Error(`保存に失敗しました（${res.status}）`);
  }
}

export async function uploadPhoto(tripId: string, file: File): Promise<string> {
  const res = await fetch(`/api/photos/${tripId}?filename=${encodeURIComponent(file.name)}`, {
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
