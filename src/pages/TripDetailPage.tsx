import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTripData, getTripDurationLabel } from "../data/TripDataContext";
import { saveTrip } from "../data/editApi";
import EncryptedImage from "../components/EncryptedImage";
import ScheduleTimeline from "./sections/ScheduleTimeline";
import TripComments from "./sections/TripComments";
import TripMap from "./sections/TripMap";
import Album from "./sections/Album";
import type { ScheduleItem, Trip } from "../types/trip";

const isDev = import.meta.env.DEV;

export default function TripDetailPage() {
  const { tripId } = useParams();
  const { getTrip, updateTrip } = useTripData();
  const trip = tripId ? getTrip(tripId) : undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Trip | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!trip) {
    return (
      <main className="container" style={{ paddingTop: 32 }}>
        <p>旅行が見つかりませんでした。</p>
        <Link to="/" style={{ color: "var(--color-accent)" }}>
          トップへ戻る
        </Link>
      </main>
    );
  }

  const displayed = isEditing && draft ? draft : trip;

  function startEditing() {
    if (!trip) return;
    setDraft(trip);
    setIsEditing(true);
    setSaveMessage(null);
  }

  function cancelEditing() {
    setDraft(null);
    setIsEditing(false);
    setSaveMessage(null);
  }

  function mutateDraft(fn: (prev: Trip) => Trip) {
    setDraft((prev) => (prev ? fn(prev) : prev));
  }

  function changeItem(index: number, patch: Partial<ScheduleItem>) {
    mutateDraft((prev) => {
      const schedule = prev.schedule.slice();
      schedule[index] = { ...schedule[index], ...patch };
      return { ...prev, schedule };
    });
  }

  function removeItem(index: number) {
    mutateDraft((prev) => ({ ...prev, schedule: prev.schedule.filter((_, i) => i !== index) }));
  }

  function addItem(date: string) {
    mutateDraft((prev) => ({
      ...prev,
      schedule: [...prev.schedule, { date, time: "12:00", name: "新しい予定", category: "観光" }],
    }));
  }

  function changeMemo(memo: string) {
    mutateDraft((prev) => ({ ...prev, memo }));
  }

  function setCover(path: string) {
    mutateDraft((prev) => ({ ...prev, coverPhoto: path }));
  }

  function addComment(author: string, text: string) {
    mutateDraft((prev) => ({
      ...prev,
      comments: [...(prev.comments ?? []), { id: crypto.randomUUID(), author, text }],
    }));
  }

  function removeComment(id: string) {
    mutateDraft((prev) => ({ ...prev, comments: (prev.comments ?? []).filter((c) => c.id !== id) }));
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveTrip(draft);
      updateTrip(draft);
      setSaveMessage("保存しました");
      setIsEditing(false);
      setDraft(null);
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <Link to="/" style={{ fontSize: 14, color: "var(--color-ink-soft)", textDecoration: "none" }}>
        ← 旅行一覧に戻る
      </Link>

      <div
        style={{
          margin: "16px 0 24px",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <EncryptedImage
          path={displayed.coverPhoto}
          alt={displayed.name}
          style={{ width: "100%", maxHeight: 360, objectFit: "cover" }}
        />
      </div>

      <h1 className="page-title" style={{ fontSize: 32, margin: "0 0 8px" }}>
        {displayed.name}
      </h1>
      <p style={{ color: "var(--color-ink-soft)", margin: "0 0 4px" }}>
        {displayed.startDate} 〜 {displayed.endDate}（{getTripDurationLabel(displayed.startDate, displayed.endDate)}）
      </p>
      <p style={{ margin: "0 0 16px" }}>{displayed.regions.join(" ・ ")}</p>

      {isEditing ? (
        <textarea
          className="field-input"
          value={draft?.memo ?? ""}
          onChange={(e) => changeMemo(e.target.value)}
          rows={2}
          placeholder="旅行の概要"
          style={{ marginBottom: 16 }}
        />
      ) : (
        displayed.memo && <p style={{ margin: "0 0 16px", color: "var(--color-ink-soft)" }}>{displayed.memo}</p>
      )}

      {isDev && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          {!isEditing ? (
            <button
              onClick={startEditing}
              style={{
                fontSize: 13,
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid var(--color-line)",
                background: "transparent",
                color: "var(--color-ink)",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  fontSize: 13,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: "var(--color-accent)",
                  color: "#fff",
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "保存中..." : "保存"}
              </button>
              <button
                onClick={cancelEditing}
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
                キャンセル
              </button>
            </>
          )}
          {saveMessage && <span style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>{saveMessage}</span>}
        </div>
      )}

      <section style={{ marginBottom: 40 }}>
        <h2 className="page-title" style={{ fontSize: 20, marginBottom: 16 }}>
          旅程
        </h2>
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "3 1 480px", minWidth: 0 }}>
            <ScheduleTimeline
              trip={displayed}
              isEditing={isEditing}
              onChangeItem={changeItem}
              onRemoveItem={removeItem}
              onAddItem={addItem}
            />
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 220 }}>
            <TripComments
              comments={displayed.comments ?? []}
              isEditing={isEditing}
              onAdd={addComment}
              onRemove={removeComment}
            />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 className="page-title" style={{ fontSize: 20, marginBottom: 16 }}>
          アルバム
        </h2>
        <Album trip={displayed} isEditing={isEditing} onSetCover={setCover} />
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 className="page-title" style={{ fontSize: 20, marginBottom: 16 }}>
          地図
        </h2>
        <TripMap trip={displayed} />
      </section>
    </main>
  );
}
