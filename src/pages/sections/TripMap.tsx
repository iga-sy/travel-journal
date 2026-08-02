import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Trip } from "../../types/trip";
import EncryptedImage from "../../components/EncryptedImage";
import { TILE_URL, TILE_ATTRIBUTION } from "../../components/mapTiles";
import { getCategoryIcon } from "../../components/categoryMarkers";
import { MapPinIcon, GlobeIcon, InstagramIcon } from "../../components/icons";

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
                <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12 }}>
                    {item.date} {item.time}
                  </span>
                  {item.googleMapsUrl && (
                    <a href={item.googleMapsUrl} target="_blank" rel="noreferrer" className="icon-link" title="Googleマップ">
                      <MapPinIcon size={13} />
                    </a>
                  )}
                  {item.officialUrl && (
                    <a href={item.officialUrl} target="_blank" rel="noreferrer" className="icon-link" title="公式サイト/食べログ">
                      <GlobeIcon size={13} />
                    </a>
                  )}
                  {item.instagramUrl && (
                    <a href={item.instagramUrl} target="_blank" rel="noreferrer" className="icon-link" title="Instagram">
                      <InstagramIcon size={13} />
                    </a>
                  )}
                </div>
                {item.photos && item.photos[0] && (
                  <EncryptedImage
                    path={item.photos[0]}
                    alt={item.name}
                    style={{ width: "100%", borderRadius: 8, marginBottom: 4 }}
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
