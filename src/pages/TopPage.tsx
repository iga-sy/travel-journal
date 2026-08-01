import { useState } from "react";
import { useTripData } from "../data/TripDataContext";
import CardView from "./views/CardView";
import CalendarView from "./views/CalendarView";
import MapView from "./views/MapView";

type ViewMode = "card" | "calendar" | "map";

export default function TopPage() {
  const [mode, setMode] = useState<ViewMode>("card");
  const { tripsIndex: trips } = useTripData();

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <h1 className="page-title" style={{ fontSize: 32, marginBottom: 8 }}>
        旅の記録
      </h1>
      <p style={{ color: "var(--color-ink-soft)", marginTop: 0, marginBottom: 24 }}>
        これまでの旅行としおりを、カード・カレンダー・地図から探せます。
      </p>

      <div className="tabbar">
        <button className={mode === "card" ? "active" : ""} onClick={() => setMode("card")}>
          カード
        </button>
        <button className={mode === "calendar" ? "active" : ""} onClick={() => setMode("calendar")}>
          カレンダー
        </button>
        <button className={mode === "map" ? "active" : ""} onClick={() => setMode("map")}>
          地図
        </button>
      </div>

      {mode === "card" && <CardView trips={trips} />}
      {mode === "calendar" && <CalendarView trips={trips} />}
      {mode === "map" && <MapView trips={trips} />}
    </main>
  );
}
