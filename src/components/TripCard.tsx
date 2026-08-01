import { Link } from "react-router-dom";
import type { TripSummary } from "../types/trip";
import { getTripDurationLabel } from "../data/TripDataContext";
import EncryptedImage from "./EncryptedImage";

export default function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="card"
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ aspectRatio: "3 / 2", overflow: "hidden" }}>
        <EncryptedImage
          path={trip.coverPhoto}
          alt={trip.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div style={{ padding: "16px 24px 24px" }}>
        <h3 className="page-title" style={{ margin: "0 0 4px", fontSize: 20 }}>
          {trip.name}
        </h3>
        <p style={{ margin: "0 0 8px", color: "var(--color-ink-soft)", fontSize: 14 }}>
          {trip.startDate} 〜 {trip.endDate}（{getTripDurationLabel(trip.startDate, trip.endDate)}）
        </p>
        <p style={{ margin: "0 0 8px", fontSize: 14 }}>{trip.regions.join(" ・ ")}</p>
        <p style={{ margin: "0 0 12px", color: "var(--color-ink-soft)", fontSize: 13 }}>
          写真 {trip.photoCount}枚
        </p>
        {trip.comment && <p style={{ margin: 0, fontSize: 14 }}>{trip.comment}</p>}
        <span style={{ display: "inline-block", marginTop: 12, color: "var(--color-accent)", fontSize: 14 }}>
          ▶ 詳細を見る
        </span>
      </div>
    </Link>
  );
}
