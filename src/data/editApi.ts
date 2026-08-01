import type { Trip } from "../types/trip";

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
