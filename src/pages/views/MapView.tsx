import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import type { TripSummary } from "../../types/trip";
import EncryptedImage from "../../components/EncryptedImage";
import { TILE_URL, TILE_ATTRIBUTION } from "../../components/mapTiles";

const JAPAN_CENTER: [number, number] = [36.2048, 138.2529];

export default function MapView({ trips }: { trips: TripSummary[] }) {
  const navigate = useNavigate();
  const center: [number, number] =
    trips.length > 0 ? [trips[0].location.lat, trips[0].location.lng] : JAPAN_CENTER;

  return (
    <div style={{ height: 520 }}>
      <MapContainer center={center} zoom={trips.length > 0 ? 6 : 5} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {trips.map((trip) => (
          <Marker key={trip.id} position={[trip.location.lat, trip.location.lng]}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <EncryptedImage
                  path={trip.coverPhoto}
                  alt={trip.name}
                  style={{ width: "100%", borderRadius: 8, marginBottom: 8 }}
                />
                <strong>{trip.name}</strong>
                <p style={{ margin: "4px 0", fontSize: 12 }}>
                  {trip.startDate} 〜 {trip.endDate}
                </p>
                <button
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  style={{
                    fontSize: 12,
                    color: "var(--color-accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Show details ▶
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
