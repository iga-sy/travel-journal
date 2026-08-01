import L from "leaflet";
import type { ScheduleCategory } from "../types/trip";

const COLOR_VAR: Record<ScheduleCategory, string> = {
  食事: "var(--color-food)",
  カフェ: "var(--color-cafe)",
  観光: "var(--color-sight)",
  移動: "var(--color-move)",
  宿泊: "var(--color-stay)",
};

const cache = new Map<ScheduleCategory, L.DivIcon>();

export function getCategoryIcon(category: ScheduleCategory): L.DivIcon {
  const cached = cache.get(category);
  if (cached) return cached;

  const color = COLOR_VAR[category];
  const icon = L.divIcon({
    className: "category-marker",
    html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 22 14 22s14-12 14-22C28 6.3 21.7 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  });
  cache.set(category, icon);
  return icon;
}
