import type { Trip, ScheduleItem } from "../../types/trip";

const BASE = import.meta.env.BASE_URL;

function groupByDate(trip: Trip): [string, ScheduleItem[]][] {
  const map = new Map<string, ScheduleItem[]>();
  for (const item of trip.schedule) {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date)!.push(item);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function ScheduleTimeline({ trip }: { trip: Trip }) {
  const groups = groupByDate(trip);

  if (groups.length === 0) {
    return <p style={{ color: "var(--color-ink-soft)" }}>スケジュールがまだ登録されていません。</p>;
  }

  return (
    <div>
      {groups.map(([date, items]) => (
        <section key={date} style={{ marginBottom: 32 }}>
          <h2 className="page-title" style={{ fontSize: 20, marginBottom: 16 }}>
            {date}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {items
              .slice()
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((item, idx) => (
                <div key={idx} className="card" style={{ display: "flex", gap: 16, padding: 16 }}>
                  <div style={{ width: 56, flexShrink: 0, color: "var(--color-ink-soft)", fontSize: 14 }}>
                    {item.time}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className={`badge badge-${item.category}`}>{item.category}</span>
                      <strong>{item.name}</strong>
                    </div>
                    {item.address && (
                      <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-ink-soft)" }}>
                        {item.address}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 12, fontSize: 13, marginBottom: 8 }}>
                      {item.googleMapsUrl && (
                        <a href={item.googleMapsUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>
                          Googleマップ
                        </a>
                      )}
                      {item.officialUrl && (
                        <a href={item.officialUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>
                          公式サイト
                        </a>
                      )}
                    </div>
                    {item.photos && item.photos.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 8, overflowX: "auto" }}>
                        {item.photos.map((p) => (
                          <img
                            key={p}
                            src={BASE + p}
                            alt={item.name}
                            style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                          />
                        ))}
                      </div>
                    )}
                    {item.memo && <p style={{ margin: 0, fontSize: 14 }}>{item.memo}</p>}
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
