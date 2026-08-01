import type { TripSummary } from "../../types/trip";
import TripCard from "../../components/TripCard";

export default function CardView({ trips }: { trips: TripSummary[] }) {
  if (trips.length === 0) {
    return <p style={{ color: "var(--color-ink-soft)" }}>まだ旅行が登録されていません。</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
