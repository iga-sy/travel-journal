import { Link } from "react-router-dom";
import type { TripSummary } from "../../types/trip";

function groupByYearMonth(trips: TripSummary[]) {
  const map = new Map<string, Map<string, TripSummary[]>>();
  for (const trip of trips) {
    const d = new Date(trip.startDate);
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1);
    if (!map.has(year)) map.set(year, new Map());
    const monthMap = map.get(year)!;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push(trip);
  }
  return map;
}

export default function CalendarView({ trips }: { trips: TripSummary[] }) {
  if (trips.length === 0) {
    return <p style={{ color: "var(--color-ink-soft)" }}>まだ旅行が登録されていません。</p>;
  }

  const grouped = groupByYearMonth(trips);
  const years = [...grouped.keys()].sort();

  return (
    <div>
      {years.map((year) => (
        <section key={year} style={{ marginBottom: 32 }}>
          <h2
            className="page-title"
            style={{ fontSize: 24, borderBottom: "1px solid var(--color-line)", paddingBottom: 8 }}
          >
            {year}年
          </h2>
          {[...grouped.get(year)!.keys()]
            .sort((a, b) => Number(a) - Number(b))
            .map((month) => (
              <div
                key={month}
                style={{ display: "flex", gap: 24, padding: "12px 0", borderBottom: "1px solid var(--color-line)" }}
              >
                <div style={{ width: 64, color: "var(--color-ink-soft)" }}>{month}月</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", flex: 1 }}>
                  {grouped
                    .get(year)!
                    .get(month)!
                    .map((trip) => (
                      <li key={trip.id} style={{ marginBottom: 4 }}>
                        <Link to={`/trips/${trip.id}`} style={{ textDecoration: "none", color: "var(--color-accent)" }}>
                          ・{trip.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
