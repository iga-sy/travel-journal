import { useState } from "react";
import type { TripComment } from "../../types/trip";

interface TripCommentsProps {
  comments: TripComment[];
  isEditing?: boolean;
  onAdd?: (author: string, text: string) => void;
  onRemove?: (id: string) => void;
}

export default function TripComments({ comments, isEditing, onAdd, onRemove }: TripCommentsProps) {
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");

  function handleAdd() {
    if (!text.trim()) return;
    onAdd?.(author.trim() || "名無し", text.trim());
    setText("");
  }

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 15, marginBottom: 12 }}>
        メモ
      </h2>
      {comments.length === 0 && !isEditing && (
        <p style={{ color: "var(--color-ink-soft)", fontSize: 13 }}>まだメモがありません。</p>
      )}
      <div style={{ marginBottom: isEditing ? 12 : 0 }}>
        {comments.map((c) => (
          <div key={c.id} className="comment-entry">
            <span className="comment-author">{c.author}:</span>
            <span className="comment-text" style={{ flex: 1 }}>
              {c.text}
            </span>
            {isEditing && (
              <button
                onClick={() => onRemove?.(c.id)}
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--color-ink-soft)",
                  cursor: "pointer",
                  fontSize: 13,
                  flexShrink: 0,
                }}
                aria-label="削除"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            className="field-input"
            value={author}
            placeholder="投稿者名"
            onChange={(e) => setAuthor(e.target.value)}
          />
          <textarea
            className="field-input"
            value={text}
            placeholder="コメント"
            rows={2}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleAdd}
            style={{
              alignSelf: "flex-start",
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px dashed var(--color-line)",
              background: "transparent",
              color: "var(--color-ink-soft)",
              cursor: "pointer",
            }}
          >
            ＋ メモを追加
          </button>
        </div>
      )}
    </div>
  );
}
