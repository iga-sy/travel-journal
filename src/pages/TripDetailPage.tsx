import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getTrip, getTripDurationLabel } from "../data/trips";
import ScheduleTimeline from "./sections/ScheduleTimeline";
import TripMap from "./sections/TripMap";
import Album from "./sections/Album";

const BASE = import.meta.env.BASE_URL;

type Tab = "schedule" | "map" | "album";

export default function TripDetailPage() {
  const { tripId } = useParams();
  const trip = tripId ? getTrip(tripId) : undefined;
  const [tab, setTab] = useState<Tab>("schedule");

  if (!trip) {
    return (
      <main className="container" style={{ paddingTop: 32 }}>
        <p>旅行が見つかりませんでした。</p>
        <Link to="/" style={{ color: "var(--color-accent)" }}>
          トップへ戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <Link to="/" style={{ fontSize: 14, color: "var(--color-ink-soft)", textDecoration: "none" }}>
        ← 旅行一覧に戻る
      </Link>

      <div
        style={{
          margin: "16px 0 24px",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <img
          src={BASE + trip.coverPhoto}
          alt={trip.name}
          style={{ width: "100%", maxHeight: 360, objectFit: "cover" }}
        />
      </div>

      <h1 className="page-title" style={{ fontSize: 32, margin: "0 0 8px" }}>
        {trip.name}
      </h1>
      <p style={{ color: "var(--color-ink-soft)", margin: "0 0 4px" }}>
        {trip.startDate} 〜 {trip.endDate}（{getTripDurationLabel(trip.startDate, trip.endDate)}）
      </p>
      <p style={{ margin: "0 0 16px" }}>{trip.regions.join(" ・ ")}</p>
      {trip.memo && <p style={{ margin: "0 0 24px", color: "var(--color-ink-soft)" }}>{trip.memo}</p>}

      <div className="tabbar">
        <button className={tab === "schedule" ? "active" : ""} onClick={() => setTab("schedule")}>
          スケジュール
        </button>
        <button className={tab === "map" ? "active" : ""} onClick={() => setTab("map")}>
          地図
        </button>
        <button className={tab === "album" ? "active" : ""} onClick={() => setTab("album")}>
          アルバム
        </button>
      </div>

      {tab === "schedule" && <ScheduleTimeline trip={trip} />}
      {tab === "map" && <TripMap trip={trip} />}
      {tab === "album" && <Album trip={trip} />}
    </main>
  );
}
