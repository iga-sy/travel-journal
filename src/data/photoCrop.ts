import type { Trip } from "../types/trip";

export function objectPositionFor(trip: Trip, path: string): string | undefined {
  const crop = trip.photoCrops?.[path];
  return crop ? `${crop.x}% ${crop.y}%` : undefined;
}
