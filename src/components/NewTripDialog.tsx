import { useState } from "react";
import { createTrip } from "../data/editApi";
import { useTripData } from "../data/TripDataContext";

interface NewTripDialogProps {
  onCreated: (tripId: string) => void;
  onClose: () => void;
}

export default function NewTripDialog({ onCreated, onClose }: NewTripDialogProps) {
  const { addTrip } = useTripData();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [regions, setRegions] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idValid = /^[a-zA-Z0-9_-]+$/.test(id);
  const canSubmit = idValid && name.trim() && startDate && endDate && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const { trip, summary } = await createTrip({
        id,
        name: name.trim(),
        startDate,
        endDate,
        regions: regions
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      });
      addTrip(trip, summary);
      onCreated(trip.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          padding: 20,
          maxWidth: 420,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 className="page-title" style={{ fontSize: 18, margin: "0 0 16px" }}>
          New Log
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
            ID（半角英数字・-・_のみ。URLに使われます）
            <input
              className="field-input"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="nasu2026_04"
              style={{ marginTop: 4 }}
            />
          </label>
          <label style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
            名前
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="那須旅行 2026春"
              style={{ marginTop: 4 }}
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ fontSize: 12, color: "var(--color-ink-soft)", flex: 1 }}>
              開始日
              <input
                className="field-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 12, color: "var(--color-ink-soft)", flex: 1 }}>
              終了日
              <input
                className="field-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </label>
          </div>
          <label style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>
            地域（カンマ区切り、任意）
            <input
              className="field-input"
              value={regions}
              onChange={(e) => setRegions(e.target.value)}
              placeholder="那須, 日光"
              style={{ marginTop: 4 }}
            />
          </label>
          {id && !idValid && (
            <p style={{ margin: 0, fontSize: 12, color: "#c0392b" }}>IDは半角英数字・-・_のみ使用できます。</p>
          )}
          {error && <p style={{ margin: 0, fontSize: 12, color: "#c0392b" }}>{error}</p>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
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
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              background: "var(--color-accent)",
              color: "#fff",
              cursor: canSubmit ? "pointer" : "default",
              opacity: canSubmit ? 1 : 0.6,
            }}
          >
            {saving ? "作成中..." : "作成"}
          </button>
        </div>
      </div>
    </div>
  );
}
