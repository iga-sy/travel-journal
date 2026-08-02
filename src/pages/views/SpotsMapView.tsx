import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { useNavigate } from "react-router-dom";
import type { ScheduleCategory } from "../../types/trip";
import { useTripData } from "../../data/TripDataContext";
import EncryptedImage from "../../components/EncryptedImage";
import { TILE_URL, TILE_ATTRIBUTION } from "../../components/mapTiles";
import { getCategoryIcon } from "../../components/categoryMarkers";
import { MapPinIcon, GlobeIcon, InstagramIcon } from "../../components/icons";

interface Spot {
  tripId: string;
  tripName: string;
  lat: number;
  lng: number;
  name: string;
  category: ScheduleCategory;
  date: string;
  time: string;
  photo?: string;
  googleMapsUrl?: string;
  officialUrl?: string;
  instagramUrl?: string;
}

export default function SpotsMapView() {
  const { tripsIndex, getTrip } = useTripData();
  const navigate = useNavigate();

  // 各旅行ページ（TripMap）で表示している位置情報付きの予定を、全旅行分まとめる。
  const spots = useMemo(() => {
    const result: Spot[] = [];
    for (const summary of tripsIndex) {
      const trip = getTrip(summary.id);
      if (!trip) continue;
      for (const item of trip.schedule) {
        if (!item.location) continue;
        result.push({
          tripId: trip.id,
          tripName: trip.name,
          lat: item.location.lat,
          lng: item.location.lng,
          name: item.name,
          category: item.category,
          date: item.date,
          time: item.time,
          photo: item.photos?.[0],
          googleMapsUrl: item.googleMapsUrl,
          officialUrl: item.officialUrl,
          instagramUrl: item.instagramUrl,
        });
      }
    }
    return result;
  }, [tripsIndex, getTrip]);

  if (spots.length === 0) {
    return <p style={{ color: "var(--color-ink-soft)" }}>位置情報が登録されたスポットがまだありません。</p>;
  }

  const bounds: LatLngBoundsExpression = spots.map((s) => [s.lat, s.lng]);

  return (
    <div style={{ height: 520 }}>
      <MapContainer bounds={bounds} boundsOptions={{ padding: [24, 24] }} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {spots.map((s, idx) => (
          <Marker key={idx} position={[s.lat, s.lng]} icon={getCategoryIcon(s.category)}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <span className={`badge badge-${s.category}`}>{s.category}</span>
                <p style={{ margin: "4px 0", fontWeight: "bold" }}>{s.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12 }}>
                    {s.date} {s.time}
                  </span>
                  {s.googleMapsUrl && (
                    <a href={s.googleMapsUrl} target="_blank" rel="noreferrer" className="icon-link" title="Googleマップ">
                      <MapPinIcon size={13} />
                    </a>
                  )}
                  {s.officialUrl && (
                    <a href={s.officialUrl} target="_blank" rel="noreferrer" className="icon-link" title="公式サイト/食べログ">
                      <GlobeIcon size={13} />
                    </a>
                  )}
                  {s.instagramUrl && (
                    <a href={s.instagramUrl} target="_blank" rel="noreferrer" className="icon-link" title="Instagram">
                      <InstagramIcon size={13} />
                    </a>
                  )}
                </div>
                {s.photo && (
                  <EncryptedImage
                    path={s.photo}
                    alt={s.name}
                    style={{ width: "100%", borderRadius: 8, marginBottom: 4 }}
                  />
                )}
                <button
                  onClick={() => navigate(`/trips/${s.tripId}`)}
                  style={{
                    fontSize: 12,
                    color: "var(--color-accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {s.tripName} ▶
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
