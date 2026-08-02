import { useState } from "react";
import type { Trip, ScheduleItem, ScheduleCategory } from "../../types/trip";
import EncryptedImage from "../../components/EncryptedImage";
import CropPicker from "../../components/CropPicker";
import { MapPinIcon, GlobeIcon, InstagramIcon, CropIcon } from "../../components/icons";
import { objectPositionFor } from "../../data/photoCrop";
import { timeOptionsWithCurrent, roundToNearestSlot } from "../../data/timeOptions";

const CATEGORIES: ScheduleCategory[] = ["食事", "カフェ", "観光", "移動", "宿泊"];

interface IndexedItem {
  item: ScheduleItem;
  index: number;
}

function groupByDate(trip: Trip): [string, IndexedItem[]][] {
  const map = new Map<string, IndexedItem[]>();
  trip.schedule.forEach((item, index) => {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date)!.push({ item, index });
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

interface ScheduleTimelineProps {
  trip: Trip;
  isEditing?: boolean;
  onChangeItem?: (index: number, patch: Partial<ScheduleItem>) => void;
  onRemoveItem?: (index: number) => void;
  onAddItem?: (date: string) => void;
  onSetCrop?: (path: string, crop: { x: number; y: number }) => void;
}

export default function ScheduleTimeline({
  trip,
  isEditing,
  onChangeItem,
  onRemoveItem,
  onAddItem,
  onSetCrop,
}: ScheduleTimelineProps) {
  const groups = groupByDate(trip);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [cropTarget, setCropTarget] = useState<string | null>(null);
  const albumPhotos = trip.photos ?? [];

  function addPhoto(index: number, path: string) {
    const current = trip.schedule[index].photos ?? [];
    if (current.includes(path)) return;
    // 最初の1枚を付けるときは、その写真の撮影時刻を予定の時刻として提案する。
    const photo = current.length === 0 ? albumPhotos.find((p) => p.path === path) : undefined;
    const inferredTime = photo?.time ? roundToNearestSlot(photo.time) : undefined;
    onChangeItem?.(index, { photos: [...current, path], ...(inferredTime ? { time: inferredTime } : {}) });
  }

  function removePhoto(index: number, path: string) {
    const current = trip.schedule[index].photos ?? [];
    onChangeItem?.(index, { photos: current.filter((p) => p !== path) });
  }

  if (groups.length === 0) {
    return <p style={{ color: "var(--color-ink-soft)" }}>スケジュールがまだ登録されていません。</p>;
  }

  return (
    <div className="timeline-days">
      {groups.map(([date, items]) => {
        const sorted = items.slice().sort((a, b) => a.item.time.localeCompare(b.item.time));
        return (
          <section key={date} className="timeline-day">
            <h2 className="page-title" style={{ fontSize: 15, marginBottom: 12 }}>
              {date}
            </h2>
            <div>
              {sorted.map(({ item, index }, i) => (
                <div key={index} className="timeline-entry">
                  <div className="timeline-rail">
                    <span className="timeline-dot" />
                    {i < sorted.length - 1 && <span className="timeline-line" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: 16 }}>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select
                            className="field-input"
                            style={{ width: 96 }}
                            value={item.time}
                            onChange={(e) => onChangeItem?.(index, { time: e.target.value })}
                          >
                            {timeOptionsWithCurrent(item.time).map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <select
                            className="field-input"
                            style={{ width: "auto" }}
                            value={item.category}
                            onChange={(e) => onChangeItem?.(index, { category: e.target.value as ScheduleCategory })}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => onRemoveItem?.(index)}
                            style={{
                              border: "none",
                              background: "none",
                              color: "var(--color-ink-soft)",
                              cursor: "pointer",
                              fontSize: 16,
                              padding: "0 4px",
                              marginLeft: "auto",
                            }}
                            aria-label="削除"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          className="field-input"
                          value={item.name}
                          placeholder="名前"
                          onChange={(e) => onChangeItem?.(index, { name: e.target.value })}
                        />
                        {item.photos && item.photos.length > 0 && (
                          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                            {item.photos.map((p) => (
                              <div key={p} style={{ position: "relative", flexShrink: 0 }}>
                                <EncryptedImage
                                  path={p}
                                  alt={item.name}
                                  style={{
                                    width: 130,
                                    maxWidth: 130,
                                    aspectRatio: "1 / 1",
                                    objectFit: "cover",
                                    objectPosition: objectPositionFor(trip, p),
                                    borderRadius: 10,
                                  }}
                                />
                                <button
                                  onClick={() => removePhoto(index, p)}
                                  aria-label="写真を外す"
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    border: "none",
                                    background: "rgba(0,0,0,0.6)",
                                    color: "#fff",
                                    fontSize: 11,
                                    lineHeight: 1,
                                    cursor: "pointer",
                                  }}
                                >
                                  ✕
                                </button>
                                <button
                                  onClick={() => setCropTarget(p)}
                                  aria-label="表示位置を調整"
                                  title="表示位置を調整"
                                  style={{
                                    position: "absolute",
                                    bottom: 4,
                                    right: 4,
                                    width: 20,
                                    height: 20,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "50%",
                                    border: "none",
                                    background: "rgba(0,0,0,0.6)",
                                    color: "#fff",
                                    cursor: "pointer",
                                  }}
                                >
                                  <CropIcon size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <button
                            onClick={() => setPickerIndex(pickerIndex === index ? null : index)}
                            style={{
                              fontSize: 12,
                              padding: "4px 10px",
                              borderRadius: 999,
                              border: "1px dashed var(--color-line)",
                              background: "transparent",
                              color: "var(--color-ink-soft)",
                              cursor: "pointer",
                            }}
                          >
                            {pickerIndex === index ? "閉じる" : "＋ 写真を追加"}
                          </button>
                          {pickerIndex === index && (
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                overflowX: "auto",
                                marginTop: 8,
                                padding: 8,
                                border: "1px solid var(--color-line)",
                                borderRadius: 10,
                              }}
                            >
                              {albumPhotos.filter((p) => p.date === item.date).length === 0 && (
                                <p style={{ fontSize: 12, color: "var(--color-ink-soft)", margin: 0 }}>
                                  この日（{item.date}）に撮影された写真がありません。
                                </p>
                              )}
                              {albumPhotos
                                .filter((p) => p.date === item.date)
                                .map((p) => {
                                const attached = (item.photos ?? []).includes(p.path);
                                return (
                                  <button
                                    key={p.path}
                                    onClick={() => addPhoto(index, p.path)}
                                    disabled={attached}
                                    title={`${p.date} ${p.time ?? ""}`}
                                    style={{
                                      padding: 0,
                                      border: attached ? "2px solid var(--color-accent)" : "none",
                                      borderRadius: 8,
                                      overflow: "hidden",
                                      flexShrink: 0,
                                      cursor: attached ? "default" : "pointer",
                                      opacity: attached ? 0.5 : 1,
                                    }}
                                  >
                                    <EncryptedImage
                                      path={p.path}
                                      alt={p.date}
                                      style={{ width: 70, height: 70, objectFit: "cover" }}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <input
                          className="field-input"
                          value={item.address ?? ""}
                          placeholder="住所"
                          onChange={(e) => onChangeItem?.(index, { address: e.target.value })}
                        />
                        <input
                          className="field-input"
                          value={item.googleMapsUrl ?? ""}
                          placeholder="GoogleマップURL"
                          onChange={(e) => onChangeItem?.(index, { googleMapsUrl: e.target.value })}
                        />
                        <input
                          className="field-input"
                          value={item.officialUrl ?? ""}
                          placeholder="公式サイト/食べログURL"
                          onChange={(e) => onChangeItem?.(index, { officialUrl: e.target.value })}
                        />
                        <input
                          className="field-input"
                          value={item.instagramUrl ?? ""}
                          placeholder="InstagramURL"
                          onChange={(e) => onChangeItem?.(index, { instagramUrl: e.target.value })}
                        />
                        <textarea
                          className="field-input"
                          value={item.memo ?? ""}
                          placeholder="メモ"
                          rows={2}
                          onChange={(e) => onChangeItem?.(index, { memo: e.target.value })}
                        />
                      </div>
                    ) : (
                      <>
                        <span className="timeline-time-pill" style={{ fontSize: 11, padding: "2px 8px" }}>
                          {item.time}
                        </span>
                        {item.photos && item.photos.length > 0 && (
                          <div style={{ display: "flex", gap: 8, marginBottom: 8, overflowX: "auto" }}>
                            {item.photos.map((p) => (
                              <EncryptedImage
                                key={p}
                                path={p}
                                alt={item.name}
                                style={{
                                  width: "100%",
                                  maxWidth: 130,
                                  aspectRatio: "1 / 1",
                                  objectFit: "cover",
                                  objectPosition: objectPositionFor(trip, p),
                                  borderRadius: 10,
                                  flexShrink: 0,
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                          <span className={`badge badge-${item.category}`} style={{ fontSize: 10, padding: "1px 8px" }}>
                            {item.category}
                          </span>
                          <strong style={{ fontSize: 13 }}>{item.name}</strong>
                        </div>
                        {item.address && (
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-ink-soft)" }}>
                            {item.address}
                          </p>
                        )}
                        {(item.googleMapsUrl || item.officialUrl || item.instagramUrl) && (
                          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                            {item.googleMapsUrl && (
                              <a href={item.googleMapsUrl} target="_blank" rel="noreferrer" className="icon-link" title="Googleマップ">
                                <MapPinIcon size={14} />
                              </a>
                            )}
                            {item.officialUrl && (
                              <a href={item.officialUrl} target="_blank" rel="noreferrer" className="icon-link" title="公式サイト/食べログ">
                                <GlobeIcon size={14} />
                              </a>
                            )}
                            {item.instagramUrl && (
                              <a href={item.instagramUrl} target="_blank" rel="noreferrer" className="icon-link" title="Instagram">
                                <InstagramIcon size={14} />
                              </a>
                            )}
                          </div>
                        )}
                        {item.memo && <p style={{ margin: 0, fontSize: 12 }}>{item.memo}</p>}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={() => onAddItem?.(date)}
                  style={{
                    fontSize: 13,
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: "1px dashed var(--color-line)",
                    background: "transparent",
                    color: "var(--color-ink-soft)",
                    cursor: "pointer",
                  }}
                >
                  + add schedule
                </button>
              )}
            </div>
          </section>
        );
      })}

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
