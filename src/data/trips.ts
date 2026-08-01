import type { Trip, TripSummary } from "../types/trip";
import tripsIndexRaw from "./trips-index.json";

// trips/ 配下に <tripId>.json を追加するだけで自動的に一覧へ反映される。
const tripModules = import.meta.glob<{ default: Trip }>("./trips/*.json", {
  eager: true,
});

const tripsById = new Map<string, Trip>();
for (const mod of Object.values(tripModules)) {
  const trip = mod.default;
  tripsById.set(trip.id, trip);
}

export const tripsIndex: TripSummary[] = tripsIndexRaw as TripSummary[];

export function getTripSummaries(): TripSummary[] {
  return [...tripsIndex].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getTrip(id: string): Trip | undefined {
  return tripsById.get(id);
}

export function getTripDurationLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) return "日帰り";
  return `${nights}泊${nights + 1}日`;
}
