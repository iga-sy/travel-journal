import { useState } from "react";
import type { Trip } from "../../types/trip";
import { saveTrip } from "../../data/editApi";
import { useTripData } from "../../data/TripDataContext";
import { SendIcon } from "../../components/icons";

const AUTHORS = ["Shuhei", "Miki", "Saya", "Yuri"];
const AUTHOR_COLORS: Record<string, string> = {
  Shuhei: "#7690a6",
  Miki: "#967295",
  Saya: "#7e9b7a",
  Yuri: "#dc9f95",
};
const DEFAULT_AUTHOR_COLOR = "#a89a90";

function authorColor(name: string) {
  return AUTHOR_COLORS[name] ?? DEFAULT_AUTHOR_COLOR;
}

interface TripCommentsProps {
  trip: Trip;
}

export default function TripComments({ trip }: TripCommentsProps) {
  const { updateTrip } = useTripData();
  const [author, setAuthor] = useState(AUTHORS[0]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comments = trip.comments ?? [];

  async function persist(nextComments: Trip["comments"]) {
    const next = { ...trip, comments: nextComments };
    await saveTrip(next);
    updateTrip(next);
  }

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await persist([...comments, { id: crypto.randomUUID(), author, text: text.trim() }]);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setSending(false);
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    try {
      await persist(comments.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  }

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 15, marginBottom: 12 }}>
        Chat
      </h2>
      {comments.length === 0 && (
        <p style={{ color: "var(--color-ink-soft)", fontSize: 13 }}>まだメモがありません。</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {comments.map((c) => {
          const color = authorColor(c.author);
          return (
            <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div
                aria-hidden="true"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: color,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {c.author.slice(0, 1)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 2 }}>{c.author}</div>
                <div
                  style={{
                    display: "inline-block",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-line)",
                    borderRadius: "4px 14px 14px 14px",
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "var(--color-ink)",
                    maxWidth: "100%",
                    wordBreak: "break-word",
                  }}
                >
                  {c.text}
                </div>
              </div>
              <button
                onClick={() => handleRemove(c.id)}
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--color-ink-soft)",
                  cursor: "pointer",
                  fontSize: 12,
                  flexShrink: 0,
                  opacity: 0.6,
                }}
                aria-label="削除"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select
          className="field-input"
          style={{ width: 88, flexShrink: 0 }}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        >
          {AUTHORS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input
          className="field-input"
          style={{ flex: 1 }}
          value={text}
          placeholder="メッセージを入力"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          aria-label="送信"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "none",
            background: "var(--color-accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: sending || !text.trim() ? "default" : "pointer",
            opacity: sending || !text.trim() ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          <SendIcon size={16} />
        </button>
      </div>
      {error && <p style={{ color: "#c0392b", fontSize: 12, margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}
