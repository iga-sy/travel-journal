import { useState } from "react";
import EncryptedImage from "./EncryptedImage";

interface CropPickerProps {
  path: string;
  initial?: { x: number; y: number };
  onSave: (crop: { x: number; y: number }) => void;
  onClose: () => void;
}

export default function CropPicker({ path, initial, onSave, onClose }: CropPickerProps) {
  const [pos, setPos] = useState(initial ?? { x: 50, y: 50 });

  function handleClick(e: React.MouseEvent<HTMLImageElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
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
          padding: 16,
          maxWidth: 520,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <p style={{ fontSize: 13, margin: "0 0 10px", color: "var(--color-ink-soft)" }}>
          サムネイルで見せたい位置をクリックしてください
        </p>
        <div style={{ position: "relative" }}>
          <EncryptedImage
            path={path}
            alt=""
            onClick={handleClick}
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 8, cursor: "crosshair" }}
          />
          <div
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: 18,
              height: 18,
              marginLeft: -9,
              marginTop: -9,
              borderRadius: "50%",
              border: "2px solid #fff",
              background: "var(--color-accent)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
              pointerEvents: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
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
            onClick={() => onSave(pos)}
            style={{
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              background: "var(--color-accent)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            この位置で保存
          </button>
        </div>
      </div>
    </div>
  );
}
