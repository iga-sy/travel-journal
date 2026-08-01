import { createContext, useContext, useState, type ReactNode } from "react";
import type { Trip, TripSummary } from "../types/trip";

interface DecryptedPayload {
  tripsIndex: TripSummary[];
  trips: Record<string, Trip>;
}

interface TripDataValue {
  tripsIndex: TripSummary[];
  getTrip: (id: string) => Trip | undefined;
  updateTrip: (trip: Trip) => void;
  imageKey: CryptoKey;
}

const TripDataContext = createContext<TripDataValue | null>(null);

export function TripDataProvider({
  data,
  imageKey,
  children,
}: {
  data: DecryptedPayload;
  imageKey: CryptoKey;
  children: ReactNode;
}) {
  const [trips, setTrips] = useState(data.trips);
  const [tripsIndex, setTripsIndex] = useState(data.tripsIndex);

  const value: TripDataValue = {
    tripsIndex: [...tripsIndex].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    getTrip: (id) => trips[id],
    updateTrip: (trip) => {
      setTrips((prev) => ({ ...prev, [trip.id]: trip }));
      setTripsIndex((prev) =>
        prev.map((t) => (t.id === trip.id && t.coverPhoto !== trip.coverPhoto ? { ...t, coverPhoto: trip.coverPhoto } : t)),
      );
    },
    imageKey,
  };
  return <TripDataContext.Provider value={value}>{children}</TripDataContext.Provider>;
}

export function useTripData(): TripDataValue {
  const ctx = useContext(TripDataContext);
  if (!ctx) throw new Error("useTripData must be used within TripDataProvider");
  return ctx;
}

export function getTripDurationLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) return "日帰り";
  return `${nights}泊${nights + 1}日`;
}
