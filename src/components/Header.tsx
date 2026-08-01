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
            Travel Log
          </span>
          <span style={{ fontSize: 12, color: "var(--color-ink-soft)", marginLeft: 8 }}>— with gratitude —</span>
        </Link>
      </div>
    </header>
  );
}
