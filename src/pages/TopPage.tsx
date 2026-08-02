import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTripData } from "../data/TripDataContext";
import NewTripDialog from "../components/NewTripDialog";
import CardView from "./views/CardView";
import CalendarView from "./views/CalendarView";
import MapView from "./views/MapView";
import SpotsMapView from "./views/SpotsMapView";

type ViewMode = "card" | "calendar" | "map" | "spots";

export default function TopPage() {
  const [mode, setMode] = useState<ViewMode>("card");
  const [showNewTrip, setShowNewTrip] = useState(false);
  const { tripsIndex: trips } = useTripData();
  const navigate = useNavigate();

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 className="page-title" style={{ fontSize: 32, marginBottom: 8 }}>
        Travel Archive
      </h1>
      <p style={{ color: "var(--color-ink-soft)", marginTop: 0, marginBottom: 24 }}>
        旅の景色を集めたアーカイブ。
        <br />
        写真とともに、思い出の旅路をゆるやかにたどれます。
      </p>

      <div className="tabbar">
        <button className={mode === "card" ? "active" : ""} onClick={() => setMode("card")}>
          Card
        </button>
        <button className={mode === "calendar" ? "active" : ""} onClick={() => setMode("calendar")}>
          Calendar
        </button>
        <button className={mode === "map" ? "active" : ""} onClick={() => setMode("map")}>
          Map
        </button>
        <button className={mode === "spots" ? "active" : ""} onClick={() => setMode("spots")}>
          Spots
        </button>
      </div>

      {mode === "card" && <CardView trips={trips} />}
      {mode === "calendar" && <CalendarView trips={trips} />}
      {mode === "map" && <MapView trips={trips} />}
      {mode === "spots" && <SpotsMapView />}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
        <button
          onClick={() => setShowNewTrip(true)}
          style={{
            fontSize: 13,
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: "var(--color-accent)",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + New Log
        </button>
      </div>

      {showNewTrip && (
        <NewTripDialog
          onClose={() => setShowNewTrip(false)}
          onCreated={(tripId) => {
            setShowNewTrip(false);
            navigate(`/trips/${tripId}`);
          }}
        />
      )}
    </main>
  );
}
