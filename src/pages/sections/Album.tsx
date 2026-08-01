import { useMemo, useState } from "react";
import type { Trip } from "../../types/trip";
import EncryptedImage from "../../components/EncryptedImage";

interface AlbumPhoto {
  src: string;
  date: string;
  place?: string;
  memo?: string;
}

function collectPhotos(trip: Trip): AlbumPhoto[] {
  const photos: AlbumPhoto[] = [];
  for (const item of trip.schedule) {
    for (const p of item.photos ?? []) {
      photos.push({ src: p, date: item.date, place: item.name, memo: item.memo });
    }
  }
  for (const p of trip.photos ?? []) {
    photos.push({ src: p.path, date: p.date });
  }
  return photos;
}

type SortMode = "date" | "place";

interface AlbumProps {
  trip: Trip;
  isEditing?: boolean;
  onSetCover?: (path: string) => void;
}

export default function Album({ trip, isEditing, onSetCover }: AlbumProps) {
  const photos = useMemo(() => collectPhotos(trip), [trip]);
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [selected, setSelected] = useState<AlbumPhoto | null>(null);

  const sorted = useMemo(() => {
    const copy = [...photos];
    if (sortMode === "date") {
      copy.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      copy.sort((a, b) => (a.place ?? "").localeCompare(b.place ?? "", "ja"));
    }
    return copy;
  }, [photos, sortMode]);

  if (photos.length === 0) {
    return <p style={{ color: "var(--color-ink-soft)" }}>写真がまだ登録されていません。</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["date", "place"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setSortMode(m)}
            style={{
              fontSize: 13,
              padding: "4px 12px",
              borderRadius: 999,
              border: "1px solid var(--color-line)",
              background: sortMode === m ? "var(--color-accent-soft)" : "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {m === "date" ? "日付順" : "場所別"}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          maxHeight: 640,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {sorted.map((photo, idx) => {
          const isCover = photo.src === trip.coverPhoto;
          return (
            <div key={idx} style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
              <button
                onClick={() => setSelected(photo)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 0,
                  border: isCover ? "2px solid var(--color-accent)" : "none",
                  background: "none",
                  cursor: "pointer",
                  borderRadius: 8,
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                <EncryptedImage
                  path={photo.src}
                  alt={photo.place ?? photo.date}
                  style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }}
                />
              </button>
              {isEditing && (
                <button
                  onClick={() => onSetCover?.(photo.src)}
                  disabled={isCover}
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 4,
                    right: 4,
                    fontSize: 11,
                    padding: "3px 6px",
                    borderRadius: 6,
                    border: "none",
                    background: isCover ? "var(--color-accent)" : "rgba(0,0,0,0.6)",
                    color: "#fff",
                    cursor: isCover ? "default" : "pointer",
                  }}
                >
                  {isCover ? "カバー写真" : "カバーに設定"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              maxWidth: 640,
              width: "100%",
            }}
          >
            <EncryptedImage
              path={selected.src}
              alt={selected.place ?? selected.date}
              style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", background: "var(--color-bg)" }}
            />
            <div style={{ padding: 16 }}>
              {selected.place && <strong>{selected.place}</strong>}
              <p style={{ margin: "4px 0", fontSize: 13, color: "var(--color-ink-soft)" }}>{selected.date}</p>
              {selected.memo && <p style={{ margin: 0, fontSize: 14 }}>{selected.memo}</p>}
              <button
                onClick={() => setSelected(null)}
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: "var(--color-accent)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
