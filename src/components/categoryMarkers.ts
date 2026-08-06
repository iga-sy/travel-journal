import L from "leaflet";
import type { ScheduleCategory } from "../types/trip";

const COLOR_VAR: Record<ScheduleCategory, string> = {
  食事: "var(--color-food)",
  カフェ: "var(--color-cafe)",
  観光: "var(--color-sight)",
  移動: "var(--color-move)",
  宿泊: "var(--color-stay)",
  雑貨: "var(--color-zakka)",
  お土産: "var(--color-souvenir)",
};

const cache = new Map<ScheduleCategory, L.DivIcon>();
const candidateCache = new Map<ScheduleCategory, L.DivIcon>();

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

// 候補地点（日程未定）は本決まりのピンと区別できるよう、輪郭のみの控えめな表示にする。
export function getCandidateIcon(category: ScheduleCategory): L.DivIcon {
  const cached = candidateCache.get(category);
  if (cached) return cached;

  const color = COLOR_VAR[category];
  const icon = L.divIcon({
    className: "category-marker",
    html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 22 14 22s14-12 14-22C28 6.3 21.7 0 14 0z" fill="#fff" fill-opacity="0.85" stroke="${color}" stroke-width="1.8" stroke-dasharray="3,2"/>
      <circle cx="14" cy="14" r="5" fill="${color}"/>
    </svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34],
  });
  candidateCache.set(category, icon);
  return icon;
}
