import { useState } from "react";
import type { Trip, CandidateItem, ScheduleCategory } from "../../types/trip";
import { MapPinIcon, GlobeIcon, InstagramIcon, StarIcon } from "../../components/icons";
import { geocodeAddress } from "../../data/geocode";

const CATEGORIES: ScheduleCategory[] = ["食事", "カフェ", "観光", "移動", "宿泊", "雑貨", "お土産"];
const UNSET_AREA = "エリア未設定";

type GroupBy = "area" | "category";

interface IndexedItem {
  item: CandidateItem;
  index: number;
}

function groupItems(candidates: CandidateItem[], groupBy: GroupBy): [string, IndexedItem[]][] {
  const map = new Map<string, IndexedItem[]>();
  candidates.forEach((item, index) => {
    const key = groupBy === "area" ? item.area?.trim() || UNSET_AREA : item.category;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ item, index });
  });
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === UNSET_AREA) return 1;
      if (b === UNSET_AREA) return -1;
      return a.localeCompare(b, "ja");
    })
    .map(([key, items]) => [key, items.sort((a, b) => a.item.name.localeCompare(b.item.name, "ja"))]);
}

interface CandidateListProps {
  trip: Trip;
  isEditing?: boolean;
  onChangeItem?: (index: number, patch: Partial<CandidateItem>) => void;
  onRemoveItem?: (index: number) => void;
  onAddItem?: () => void;
}

export default function CandidateList({ trip, isEditing, onChangeItem, onRemoveItem, onAddItem }: CandidateListProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("area");
  const [geoStatus, setGeoStatus] = useState<Record<number, "loading" | "error" | undefined>>({});
  const candidates = trip.candidates ?? [];
  const groups = groupItems(candidates, groupBy);

  async function fetchLocation(index: number, address: string) {
    if (!address.trim()) return;
    setGeoStatus((prev) => ({ ...prev, [index]: "loading" }));
    try {
      const location = await geocodeAddress(address);
      if (!location) {
        setGeoStatus((prev) => ({ ...prev, [index]: "error" }));
        return;
      }
      onChangeItem?.(index, { location });
      setGeoStatus((prev) => ({ ...prev, [index]: undefined }));
    } catch {
      setGeoStatus((prev) => ({ ...prev, [index]: "error" }));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>並び替え：</span>
        {(["area", "category"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGroupBy(g)}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              border: "1px solid var(--color-line)",
              background: groupBy === g ? "var(--color-accent)" : "transparent",
              color: groupBy === g ? "#fff" : "var(--color-ink-soft)",
              cursor: "pointer",
            }}
          >
            {g === "area" ? "エリア" : "ジャンル"}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <p style={{ color: "var(--color-ink-soft)", marginBottom: isEditing ? 12 : 0 }}>候補がまだ登録されていません。</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {groups.map(([key, items]) => (
          <section key={key}>
            <h3 className="page-title" style={{ fontSize: 14, marginBottom: 10, color: "var(--color-ink-soft)" }}>
              {key}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {items.map(({ item, index }) => (
                <div
                  key={index}
                  className="card"
                  style={{ padding: 14 }}
                >
                  {isEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                      <input
                        className="field-input"
                        value={item.area ?? ""}
                        placeholder="エリア（例: 那須町）"
                        onChange={(e) => onChangeItem?.(index, { area: e.target.value })}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          className="field-input"
                          value={item.address ?? ""}
                          placeholder="住所"
                          onChange={(e) => onChangeItem?.(index, { address: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => fetchLocation(index, item.address ?? "")}
                          disabled={!item.address?.trim() || geoStatus[index] === "loading"}
                          title="住所から座標を自動取得"
                          style={{
                            flexShrink: 0,
                            fontSize: 12,
                            padding: "0 10px",
                            borderRadius: 6,
                            border: "1px solid var(--color-line)",
                            background: "transparent",
                            color: "var(--color-ink-soft)",
                            cursor: item.address?.trim() ? "pointer" : "default",
                          }}
                        >
                          {geoStatus[index] === "loading" ? "取得中…" : item.location ? "再取得" : "座標取得"}
                        </button>
                      </div>
                      {geoStatus[index] === "error" && (
                        <p style={{ margin: 0, fontSize: 11, color: "var(--color-food)" }}>
                          座標が見つかりませんでした。住所を調整して再試行してください。
                        </p>
                      )}
                      {item.location && geoStatus[index] !== "loading" && (
                        <p style={{ margin: 0, fontSize: 11, color: "var(--color-ink-soft)" }}>
                          座標: {item.location.lat.toFixed(6)}, {item.location.lng.toFixed(6)}
                        </p>
                      )}
                      <input
                        className="field-input"
                        value={item.googleMapsUrl ?? ""}
                        placeholder="GoogleマップURL"
                        onChange={(e) => onChangeItem?.(index, { googleMapsUrl: e.target.value })}
                      />
                      <input
                        className="field-input"
                        value={item.officialUrl ?? ""}
                        placeholder="公式サイトURL"
                        onChange={(e) => onChangeItem?.(index, { officialUrl: e.target.value })}
                      />
                      <input
                        className="field-input"
                        value={item.tabelogUrl ?? ""}
                        placeholder="食べログURL"
                        onChange={(e) => onChangeItem?.(index, { tabelogUrl: e.target.value })}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                        <span className={`badge badge-${item.category}`} style={{ fontSize: 10, padding: "1px 8px" }}>
                          {item.category}
                        </span>
                        <strong style={{ fontSize: 13 }}>{item.name}</strong>
                      </div>
                      {item.address && (
                        <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-ink-soft)" }}>{item.address}</p>
                      )}
                      {(item.googleMapsUrl || item.officialUrl || item.tabelogUrl || item.instagramUrl) && (
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          {item.googleMapsUrl && (
                            <a href={item.googleMapsUrl} target="_blank" rel="noreferrer" className="icon-link" title="Googleマップ">
                              <MapPinIcon size={14} />
                            </a>
                          )}
                          {item.officialUrl && (
                            <a href={item.officialUrl} target="_blank" rel="noreferrer" className="icon-link" title="公式サイト">
                              <GlobeIcon size={14} />
                            </a>
                          )}
                          {item.tabelogUrl && (
                            <a href={item.tabelogUrl} target="_blank" rel="noreferrer" className="icon-link" title="食べログ">
                              <StarIcon size={14} />
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
              ))}
            </div>
          </section>
        ))}
      </div>

      {isEditing && (
        <button
          onClick={() => onAddItem?.()}
          style={{
            fontSize: 13,
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px dashed var(--color-line)",
            background: "transparent",
            color: "var(--color-ink-soft)",
            cursor: "pointer",
            marginTop: 16,
          }}
        >
          + add candidate
        </button>
      )}
    </div>
  );
}
