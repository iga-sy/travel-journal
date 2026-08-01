import { useState, type FormEvent, type ReactNode } from "react";
import { isUnlocked, setUnlocked, verifyPassword } from "../auth/sitePassword";

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlockedState] = useState(isUnlocked());
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await verifyPassword(input);
    if (ok) {
      setUnlocked();
      setUnlockedState(true);
    } else {
      setError(true);
    }
  }

  if (unlocked) return <>{children}</>;

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
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "var(--color-accent)",
            color: "#fff",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          入る
        </button>
      </form>
    </div>
  );
}
