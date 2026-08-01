import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Trip } from "../../types/trip";
import EncryptedImage from "../../components/EncryptedImage";
import { TILE_URL, TILE_ATTRIBUTION } from "../../components/mapTiles";
import { getCategoryIcon } from "../../components/categoryMarkers";

const JAPAN_CENTER: [number, number] = [36.2048, 138.2529];

export default function TripMap({ trip }: { trip: Trip }) {
  const pins = trip.schedule.filter((item) => item.location);
  const center: [number, number] =
    pins.length > 0 ? [pins[0].location!.lat, pins[0].location!.lng] : JAPAN_CENTER;

  if (pins.length === 0) {
    return <p style={{ color: "var(--color-ink-soft)" }}>位置情報が登録されたスケジュールがまだありません。</p>;
  }

  return (
    <div style={{ height: 520 }}>
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {pins.map((item, idx) => (
          <Marker key={idx} position={[item.location!.lat, item.location!.lng]} icon={getCategoryIcon(item.category)}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <span className={`badge badge-${item.category}`}>{item.category}</span>
                <p style={{ margin: "4px 0", fontWeight: "bold" }}>{item.name}</p>
                <p style={{ margin: "0 0 4px", fontSize: 12 }}>
                  {item.date} {item.time}
                </p>
                {item.photos && item.photos[0] && (
                  <EncryptedImage
                    path={item.photos[0]}
                    alt={item.name}
                    style={{ width: "100%", borderRadius: 8, marginBottom: 4 }}
                  />
                )}
                {item.memo && <p style={{ margin: 0, fontSize: 12 }}>{item.memo}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
