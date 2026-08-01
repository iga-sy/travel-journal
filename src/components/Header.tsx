import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header style={{ padding: "24px 0", borderBottom: "1px solid var(--color-line)" }}>
      <div
        className="container"
        style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}
      >
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="page-title" style={{ fontSize: 24 }}>
            旅ノート
          </span>
        </Link>
        <span style={{ color: "var(--color-ink-soft)", fontSize: 13 }}>Travel Journal</span>
      </div>
    </header>
  );
}
