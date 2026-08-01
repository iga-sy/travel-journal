import { useState, type FormEvent, type ReactNode } from "react";
import { deriveKey, decryptToJson } from "../crypto/decrypt";
import { TripDataProvider } from "../data/TripDataContext";
import type { Trip, TripSummary } from "../types/trip";

const BASE = import.meta.env.BASE_URL;

interface EncMeta {
  salt: string;
  iterations: number;
}

interface DecryptedPayload {
  tripsIndex: TripSummary[];
  trips: Record<string, Trip>;
}

interface UnlockedState {
  data: DecryptedPayload;
  imageKey: CryptoKey;
}

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<UnlockedState | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const metaRes = await fetch(`${BASE}enc-meta.json`);
      const meta: EncMeta = await metaRes.json();

      const key = await deriveKey(input, meta.salt, meta.iterations);

      const dataRes = await fetch(`${BASE}data.enc`);
      const buf = await dataRes.arrayBuffer();
      const data = await decryptToJson<DecryptedPayload>(key, buf);

      setUnlocked({ data, imageKey: key });
    } catch {
      // AES-GCMの認証タグ不一致（＝パスワード違い）を含め、失敗はすべて「パスワードが違います」として扱う
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (unlocked) {
    return (
      <TripDataProvider data={unlocked.data} imageKey={unlocked.imageKey}>
        {children}
      </TripDataProvider>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        color: "var(--color-ink)",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ padding: 32, width: "100%", maxWidth: 320, textAlign: "center" }}
      >
        <p className="page-title" style={{ fontSize: 22, margin: "0 0 8px" }}>
          旅ノート
        </p>
        <p style={{ color: "var(--color-ink-soft)", fontSize: 14, margin: "0 0 20px" }}>
          パスワードを入力してください
        </p>
        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          autoFocus
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${error ? "#c0392b" : "var(--color-line)"}`,
            background: "var(--color-surface)",
            color: "var(--color-ink)",
            fontSize: 16,
            marginBottom: 12,
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p style={{ color: "#c0392b", fontSize: 13, margin: "0 0 12px" }}>
            パスワードが違います。
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "var(--color-accent)",
            color: "#fff",
            fontSize: 15,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "復号中..." : "入る"}
        </button>
      </form>
    </div>
  );
}
