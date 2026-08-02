import { useMemo, useRef, useState } from "react";
import exifr from "exifr";
import type { Trip } from "../../types/trip";
import EncryptedImage from "../../components/EncryptedImage";
import CropPicker from "../../components/CropPicker";
import { CropIcon } from "../../components/icons";
import { uploadPhoto } from "../../data/editApi";
import { objectPositionFor } from "../../data/photoCrop";
import { timeOptionsWithCurrent } from "../../data/timeOptions";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

async function readShotAt(file: File): Promise<{ date: string; time: string } | null> {
  try {
    const exif = await exifr.parse(file, ["DateTimeOriginal", "CreateDate"]);
    const d: Date | undefined = exif?.DateTimeOriginal ?? exif?.CreateDate;
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
    const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    return { date, time };
  } catch {
    return null;
  }
}

interface AlbumPhoto {
  src: string;
  date: string;
  time?: string;
  place?: string;
  memo?: string;
  scheduleIndex?: number;
}

function collectPhotos(trip: Trip): AlbumPhoto[] {
  const photos: AlbumPhoto[] = [];
  trip.schedule.forEach((item, scheduleIndex) => {
    for (const p of item.photos ?? []) {
      photos.push({ src: p, date: item.date, time: item.time, place: item.name, memo: item.memo, scheduleIndex });
    }
  });
  for (const p of trip.photos ?? []) {
    photos.push({ src: p.path, date: p.date, time: p.time });
  }
  return photos;
}

type SortMode = "date" | "place";

interface AlbumProps {
  trip: Trip;
  isEditing?: boolean;
  onSetCover?: (path: string) => void;
  onAddPhoto?: (path: string, date: string, time: string) => void;
  onRemovePhoto?: (photo: { src: string; scheduleIndex?: number }) => void;
  onSetCrop?: (path: string, crop: { x: number; y: number }) => void;
}

export default function Album({ trip, isEditing, onSetCover, onAddPhoto, onRemovePhoto, onSetCrop }: AlbumProps) {
  const photos = useMemo(() => collectPhotos(trip), [trip]);
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [selected, setSelected] = useState<AlbumPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDate, setPendingDate] = useState(trip.startDate);
  const [pendingTime, setPendingTime] = useState("12:00");
  const [cropTarget, setCropTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => {
    const copy = [...photos];
    if (sortMode === "date") {
      copy.sort((a, b) => `${a.date}T${a.time ?? ""}`.localeCompare(`${b.date}T${b.time ?? ""}`));
    } else {
      copy.sort((a, b) => (a.place ?? "").localeCompare(b.place ?? "", "ja"));
    }
    return copy;
  }, [photos, sortMode]);

  async function doUpload(file: File, date: string, time: string) {
    setUploading(true);
    setUploadError(null);
    try {
      const path = await uploadPhoto(trip.id, file);
      onAddPhoto?.(path, date, time);
      setPendingFile(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);

    const shotAt = await readShotAt(file);
    if (shotAt) {
      await doUpload(file, shotAt.date, shotAt.time);
    } else {
      // 撮影日時が読み取れない写真は、日付・時刻を手入力してもらう
      setPendingFile(file);
      setPendingDate(trip.startDate);
      setPendingTime("12:00");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
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

      {isEditing && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 16,
            padding: 10,
            border: "1px dashed var(--color-line)",
            borderRadius: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                fontSize: 13,
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid var(--color-line)",
                background: "transparent",
                color: "var(--color-ink)",
                cursor: uploading ? "default" : "pointer",
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "アップロード中..." : "＋ 写真を選ぶ"}
            </button>
            <span style={{ fontSize: 11, color: "var(--color-ink-soft)" }}>撮影日時は写真から自動で読み取ります。</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChosen}
              style={{ display: "none" }}
            />
            {uploadError && <span style={{ fontSize: 12, color: "#c0392b" }}>{uploadError}</span>}
          </div>

          {pendingFile && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
                「{pendingFile.name}」は撮影日時が読み取れませんでした。日付・時刻を入力してください。
              </span>
              <input
                className="field-input"
                style={{ width: 150 }}
                type="date"
                value={pendingDate}
                onChange={(e) => setPendingDate(e.target.value)}
              />
              <select
                className="field-input"
                style={{ width: 96 }}
                value={pendingTime}
                onChange={(e) => setPendingTime(e.target.value)}
              >
                {timeOptionsWithCurrent(pendingTime).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                onClick={() => doUpload(pendingFile, pendingDate, pendingTime)}
                disabled={uploading}
                style={{
                  fontSize: 13,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: "var(--color-accent)",
                  color: "#fff",
                  cursor: uploading ? "default" : "pointer",
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                追加
              </button>
              <button
                onClick={() => setPendingFile(null)}
                style={{
                  fontSize: 13,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid var(--color-line)",
                  background: "transparent",
                  color: "var(--color-ink-soft)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {photos.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)" }}>写真がまだ登録されていません。</p>
      ) : (
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
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      objectPosition: objectPositionFor(trip, photo.src),
                    }}
                  />
                </button>
                {isEditing && (
                  <>
                    <button
                      onClick={() => onRemovePhoto?.({ src: photo.src, scheduleIndex: photo.scheduleIndex })}
                      aria-label="削除"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: 12,
                        lineHeight: 1,
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                    <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", gap: 4 }}>
                      <button
                        onClick={() => onSetCover?.(photo.src)}
                        disabled={isCover}
                        style={{
                          flex: 1,
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
                      <button
                        onClick={() => setCropTarget(photo.src)}
                        aria-label="表示位置を調整"
                        title="表示位置を調整"
                        style={{
                          width: 26,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 6,
                          border: "none",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <CropIcon size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

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

      {cropTarget && (
        <CropPicker
          path={cropTarget}
          initial={trip.photoCrops?.[cropTarget]}
          onClose={() => setCropTarget(null)}
          onSave={(crop) => {
            onSetCrop?.(cropTarget, crop);
            setCropTarget(null);
          }}
        />
      )}
    </div>
  );
}
